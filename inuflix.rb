# coding for Ruby 2.0

require "neography"
require "sinatra"
require "haml"

neo = Neography::Rest.new

def execute_cypher(neo, namespace, keyword)
  w3type = "http://www.w3.org/1999/02/22-rdf-syntax-ns\#type"
  cypher_query =  " START x=node:`#{namespace}`(name = '#{keyword}')"
  cypher_query << " MATCH (x)-[?:#{w3type}]-(t)"
  cypher_query << " RETURN x.uri, t.name"
  cypher_query << " LIMIT 100"
  puts cypher_query
  neo.execute_query(query)["data"]
end

get "/exec_cypher" do
  content_type :json
  execute_cypher(neo, "http://ccle.acme.org/","FOXA1")
end

get "/" do
  "Hey!"
end
