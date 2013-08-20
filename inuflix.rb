# coding for Ruby 2.0

require "neography"
require "sinatra"
require "yaml"
require "json"

neo = Neography::Rest.new(ENV['NEO4J_URL'] || YAML.load_file("./config.yaml")["neo4j_server"])

post "/exec" do
  request.body.rewind
  data = JSON.parse(request.body.read)
  query = data["query"]
  
  content_type :json
  neo.execute_query(query)
end

get "/" do
  "Hey!"
end
