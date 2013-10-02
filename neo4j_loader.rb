# coding for Ruby 2.0

require "neography"
require "uri"

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
    
    node_fpath = ARGV.first
    rel_fpath = ARGV.last
    index_name = node_fpath.split("/").last + "." + rel_fpath.split("/").last
    
    nodes = open(node_fpath){|f| JSON.load(f) }
    nodes.each do |node_spec|
      load_node(neo, index_name, node_spec)
    end
    
    relations = open(rel_fpath){|f| JSON.load(f) }
    relations.each do |relation_spec|
      load_relationship(neo, index_name, relation_spec)
    end
    
  else
    puts "usage:"
    puts "ruby neo4j_loader.rb <RDF(.rdf/.ttl/.nt)>"
    puts "ruby neo4j_loader.rb <table file(node)> <table file(relation)>"
  end
end
