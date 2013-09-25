# coding for Ruby 2.0

require "rdf"
require "uri"
require "neography"

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
    #neo.set_relationship_properties(rel, {"type" => type})
  end
end

def uri?(string)
  string if string =~ /^http/
end

if __FILE__ == $0
  neo = Neography::Rest.new(ENV["NEO4J_URL"] || "http://localhost:7474")
  
  @fpath = ARGV.first
  RDF::Reader.open(@fpath) do |reader|
    reader.each_statement do |statement|
      subject = statement.subject.to_s
      predicate = statement.predicate.to_s
      object = statement.object.to_s
      
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
  end
end
