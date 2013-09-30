# coding for Ruby 2.0

require "uri"
require "neography"

# GENERAL METHODS

def get_or_create_node(neo, uri)
  uri_p = URI.parse(uri)
  name = uri_p.path.gsub(/^\//,"")
  namespace = uri_p.scheme + "://" + uri_p.host + "/"
  node = neo.get_node_index(namespace, "name", name)
  
  if !node
    node = neo.create_node("uri" => uri, "name" => name)
    neo.add_node_to_index(namespace, "name", name, node)
    neo.add_node_to_index("files", "file", @fpath, node)
  end
  node
rescue Neography::NotFoundException
  neo.create_node_index(namespace)
  neo.create_node_index("files")
  retry
end

def set_property(neo, node, type, value)
  property = neo.get_node_properties(node, type)
  raise NameError if !property.values.include?(value)
rescue Neography::NoSuchPropertyException
  neo.set_node_properties(node, {type => value})
end

def get_or_create_relationship(neo, node_start, node_end, type)
  rel = neo.get_node_relationships(node_start, "out", type)
  if !rel
    neo.create_relationship(type, node_start, node_end)
    neo.set_relationship_properties(rel, {"type" => type})
  end
end

def uri?(string)
  string if string =~ /^http/
end

# A METHOD FOR VARIOUS RDF FORMATS INPUT

def load_rdf(neo, subject, predicate, object)
  # get/create node for subject
  node_s = get_or_create_node(neo, subject)
      
  if !uri?(object)
    # object is literal: set object as property, type = predicate
    set_property(neo, node_s, predicate, object)
  else
    # object is uri: get/create node for object and make relationship, type = predicate
    node_o = get_or_create_node(neo, object)
    get_or_create_relationship(neo, node_s, node_o, predicate)
  end
end

# METHODS FOR TABULAR INPUT

def load_node(neo, node_spec)
  node_id = node_spec["id"]
  node = get_or_create_node(neo, node_id)

  node_properties = node_spec["properties"]
  node_properties.each do |property|
    type = property["name"]
    value = property["value"]
    set_property(neo, node, type, value)
  end
end

def load_relation(neo, relation_spec)
  start_id = relation_spec["source"]
  end_id = relation_spec["end"]
  type = relation_spec["properties"][0]["value"] # not quite elegant
  
  start_node = get_or_create_node(neo, start_id)
  end_node = get_or_create_node(neo, end_id)
  
  get_or_crete_relationship(neo, start_node, end_node, type)
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
    
  when ARGV.length == 2
    require "json"

    nodes = open(ARGV.first){|f| JSON.load(f) }
    nodes.each do |node_spec|
      load_node(neo, node_spec)
    end
    
    relations = open(ARGV.last){|f| JSON.load(f) }
    relations.each do |relation_spec|
      load_relation(neo, relation_spec)
    end
    
  else
    puts "usage:"
    puts "ruby neo4j_loader.rb <RDF(.rdf/.ttl/.nt)>"
    puts "ruby neo4j_loader.rb <table file(node)> <table file(relation)>"
  end
end
