# coding for Ruby 2.0

require "neography"
require "sinatra"
require "yaml"
require "cgi"
require "uri"

neo = Neography::Rest.new(ENV['NEO4J_URL'] || YAML.load_file("./config.yaml")["neo4j_server"])

post "/exec" do
  param = URI(request.body.read).query
  query = CGI::parse(param)["query"].first

  content_type :json
  neo.execute_query(query)
end

get "/" do
  "Hey!"
end
