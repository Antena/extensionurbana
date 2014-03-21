use Rack::Static,
  :urls => ["/bootstrap", "/css", "/fonts", "/images", "/js", "/tiles", "/zoning", "/data"],
  :root => "public"

run lambda { |env|
  [
    200,
    {
      'Content-Type'  => 'text/html',
      'Cache-Control' => 'public, max-age=86400'
    },
    File.open('public/index.html', File::RDONLY)
  ]
}

map "/intro" do
    run lambda { |env|
      [
        200,
        {
          'Content-Type'  => 'text/html',
          'Cache-Control' => 'public, max-age=86400'
        },
        File.open('public/intro.html', File::RDONLY)
      ]
    }
end