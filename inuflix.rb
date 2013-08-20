# coding for Ruby 2.0

require "neography"
require "sinatra"
require "yaml"
require "uri"

neo = Neography::Rest.new(ENV['NEO4J_URL'] || YAML.load_file("./config.yaml")["neo4j_server"])

post "/exec" do
  request.body.rewind
  query = URI.decode(request.body.read.sub(/^query=/,"")).gsub("+","\s")
  
  content_type :json
  neo.execute_query(query).to_json
end

get "/" do
  "Hey!"
end
