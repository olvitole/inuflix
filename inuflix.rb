# coding for Ruby 2.0

require "neography"
require "sinatra"
require "haml"
require "yaml"

config = YAML.load_file("./config.yaml")
neo = Neography::Rest.new(ENV['NEO4J_URL'] || config["neo4j_server"])

def search_concept(neo, namespace, keyword)
  w3type = "http://www.w3.org/1999/02/22-rdf-syntax-ns\#type"
  cypher_query =  " START x=node:`#{namespace}`(\"name:#{keyword}\")"
  cypher_query << " MATCH (x)-[?:`#{w3type}`]-(t)"
  cypher_query << " RETURN x.uri, t.name"
  cypher_query << " LIMIT 100"
  neo.execute_query(cypher_query)["data"]
end

get "/search_concept" do
  content_type :json
  search_concept(neo, params[:namespace], params[:keyword]).to_json
end

get "/" do
  "Hey!"
end
