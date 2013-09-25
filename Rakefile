# :)

task :default => :help

namespace :db do
  desc "loading data to neo4j"
  task :load_rdf do
    ruby "./load_rdf_to_neo4j.rb ./public/#{ARGV.first}"
  end
end

task :help do
  puts "usage:"
  puts "  put your RDF file in public folder"
  puts "  rake db:load_rdf <filename.rdf>"
end

