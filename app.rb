# :)

require "neography"
require "sinatra"
require "sinatra/cross_origin"
require "yaml"
require "uri"

enable :cross_origin

#neo = Neography::Rest.new(ENV['NEO4J_URL'] || YAML.load_file("./config.yaml")["neo4j_server"])
neo = Neography::Rest.new(YAML.load_file("./config.yaml")["neo4j_server"])

post "/exec" do
  request.body.rewind
  query = URI.decode(request.body.read.sub(/^query=/,"")).gsub("+","\s")
  content_type :json
  cross_origin
  neo.execute_query(query).to_json
end

get "/*" do
  "Hey!"
end
