# coding for Ruby 2.0

require "neography"
require "uri"
require "parallel"

# GENERAL METHODS
# get or create and return node/relationship object
# set and varidate properties for node/relationship

def add_node_to_index(neo, index_name, key, value, node)
  neo.add_node_to_index(index_name, key, value, node)
rescue Neography::NotFoundException
  neo.create_node_index(index_name)
  retry
end

def set_node_property(neo, node, key, value)
  node_properties = neo.get_node_properties(node, key)
  raise NameError if node_properties.values.first != value
rescue Neography::NoSuchPropertyException
  neo.set_node_properties(node, {key => value})
end

def get_or_create_node(neo, index_name, key, value)
  node = neo.get_node_index(index_name, key, value)
  if !node
    node = neo.create_node
    add_node_to_index(neo, index_name, key, value, node)
    set_node_property(neo, node, key, value)
  end
  node
rescue Neography::NotFoundException
  neo.create_node_index(index_name)
  retry
end

def get_or_create_relationship(neo, node_start, node_end, type)
  rel = neo.get_node_relationships_to(node_start, node_end, "out", type)
  if !rel
    rel = neo.create_relationship(type, node_start, node_end)
  end
  rel
end

def set_relationship_property(neo, rel, key, value)
  rel_properties = neo.get_relationship_properties(rel, key)
  raise NameError if rel_properties.values.first != value
rescue Neography::NoSuchPropertyException
  neo.set_relationship_properties(rel, {key => value})
end

# FOR STANDARD S-P-O MODEL INPUT
# parsing uri, load RDF to neo4j

def parse_uri(uri)
  uri_p = URI.parse(uri)
  name = uri_p.path.gsub(/^\//,"")
  namespace = uri_p.scheme + "://" + uri_p.host + "/"
  { namespace: namespace, name: name}
end

def uri?(string)
  string if string =~ /^http/
end

def load_rdf(neo, subject, predicate, object)
  parsed_uri = parse_uri(subject)
  node_s = get_or_create_node(neo, parsed_uri["namespace"], "name", parsed_uri["name"])
  set_node_property(neo, node_s, "uri", subject)
  
  if uri?(object)
    # object is uri: get/create node for object and make relationship, type = predicate
    node_o = get_or_create_node(neo, object)
    get_or_create_relationship(neo, node_s, node_o, predicate)
  else
    # object is literal: set object as property, type = predicate
    set_property(neo, node_s, predicate, object)
  end
end

# METHODS FOR JSON INPUT, SEPARATED FOR NODES AND RELS
# for third normalized form, load node/relationship

def load_node(neo, index_name, node_spec)
  node_id = node_spec["id"]
  node = get_or_create_node(neo, index_name, "id", node_id)

  node_properties = node_spec["properties"]
  node_properties.each do |property|
    key = property["name"]
    value = property["value"]
    set_node_property(neo, node, key, value)
  end
end

def load_relationship(neo, index_name, relation_spec)
  start_id = relation_spec["source"]
  end_id = relation_spec["target"]
  rel_properties = relation_spec["properties"]
  type = rel_properties.shift["value"] # not quite elegant
  
  start_node = get_or_create_node(neo, index_name, "id", start_id)
  end_node = get_or_create_node(neo, index_name, "id", end_id)
  rel = get_or_create_relationship(neo, start_node, end_node, type)
  
  rel_properties.each do |property|
    key = property["name"]
    value = property["value"]
    set_relationship_property(neo, rel, key, value)
  end
end

# METHODS FOR BATCH IMPORT
# ref: http://www.slideshare.net/maxdemarzi/etl-into-neo4j
# currently implemented as mock method, fix it later (maybe)

def batch_load(neo)
  graph_exist = neo.get_node_properties(1)
  return if graph_exist && graph_exists["name"]
  names = 200.times.collect{|x| generate_text }
  commands = names.map{|n| [:create_node, { "name" => n }] }
  names.each_index do |x|
    follows = names.size.times.map{|y| y }
    follows.delete_at(x)
    follows.sample(rand(10)).each do |f|
      commands << [:create_relationship, "follows", "{#{x}}", "{#{f}}"]
    end
  end
  batch_result = neo.batch *commands
end

if __FILE__ == $0
  neo = Neography::Rest.new(ENV["NEO4J_URL"] || "http://localhost:7474")
  
  case ARGV.length
  when 1
    require "rdf"
    include RDF
    
    # load more gems for serialization
    if ARGV.first =~ /(\.ttl|\.rdf)$/
      # raptor command line tool installation required
      require "rdf/raptor"
    elsif ARGV.first =~ /\.nt$/
      require "rdf/ntriples"
    end
    
    RDF::Reader.open(ARGV.first) do |reader|
      # RDF reader stream
      reader.each_statement do |statement|
        subject = statement.subject.to_s
        predicate = statement.predicate.to_s
        object = statement.object.to_s
        load_rdf(neo, subject, predicate, object)
      end
    end
    
  when 2
    require "json"
    
    node_file = ARGV.first
    node_filename = node_file.split("/").last
    nodes = open(node_file){|f| JSON.load(f) }
    Parallel.each(nodes, :in_threads => 2) do |node_spec|
      load_node(neo, node_filename, node_spec)
    end
    
    rel_file = ARGV.last
    rel_filename = rel_file.split("/").last
    relations = open(rel_file){|f| JSON.load(f) }
    Parallel.each(relations, :in_threads => 2) do |relation_spec|
      load_relationship(neo, rel_filename, relation_spec)
    end
    
  else
    puts "usage:"
    puts "ruby neo4j_loader.rb <RDF(.rdf/.ttl/.nt)>"
    puts "ruby neo4j_loader.rb <table file(node)> <table file(relation)>"
  end
end
