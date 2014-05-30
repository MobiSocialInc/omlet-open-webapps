require 'csv'
require 'json'
require 'fileutils'

if ARGV.empty?
  puts "usage: ./gen-i18next.rb csvfilename"
  exit
end

row_array = CSV.read(ARGV[0])
key_array = []
lang_array = []

key_array = []
for i in 1..row_array.length-1
  key_array.push(row_array[i].first)
end

for i in 1..row_array[0].length-1
  lang_array.push(row_array[0][i])
end


lang_array.each_with_index do |lang, index|
  values_array = []
  for i in 1..key_array.length
    values_array.push(row_array[i][index+1])
  end

  lang_dir_path = 'locales/' + lang
  FileUtils.mkdir_p lang_dir_path

  lang_hash = Hash[key_array.zip(values_array)]
  File.write(lang_dir_path + '/translation.json', lang_hash.to_json)
  puts 'Write ' + lang_hash.to_json + ' to ' + lang_dir_path + '/translation.json ...'
end

