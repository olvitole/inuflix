# coding for Ruby 2.0

require "neography"
require "sinatra"
require "haml"

neo = Neography::Rest.new(ENV['NEO4J_URL'] || "http://localhost:7474/")

def query_builder(namespace, keyword)
  w3type = "http://www.w3.org/1999/02/22-rdf-syntax-ns\#type"
  cypher_query =  " START x=node:`#{namespace}`(name = '#{keyword}')"
  cypher_query << " MATCH (x)-[?:`#{w3type}`]-(t)"
  cypher_query << " RETURN x.uri, t.name"
  cypher_query << " LIMIT 100"
end

def execute_cypher(neo, namespace, keyword)
  cypher_query = query_builder(namespace, keyword)
  neo.execute_query(cypher_query)["data"]
end

get "/exec_cypher" do
  content_type :json
  execute_cypher(neo, "http://tcng.hgc.jp/", "FOXA1")
end

get "/build_query" do
  query_builder("http://tcng.hgc.jp/", "FOXA1")
end

get "/" do
  "Hey!"
end
