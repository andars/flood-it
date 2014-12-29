require 'bundler'
Bundler.require
Faye::WebSocket.load_adapter('thin')

enable :sessions
register Sinatra::Flash

set :port, 8000
set :environment, :production
set :sockets, []
set :waiting, nil
set :pairs, []


get '/ws' do
  if Faye::WebSocket.websocket?(request.env)
    ws = Faye::WebSocket.new(request.env)
    my_index = nil
    puts 'lel'   
    ws.on(:open) do |event|
      settings.sockets << ws
      my_index = settings.sockets.length-1

      if (settings.waiting.nil?) 
        settings.waiting = ws
      else
        settings.pairs[settings.sockets.length-2] = my_index
        settings.pairs[my_index] = settings.sockets.length-2
        random = Random.rand(100000).to_s
        settings.waiting.send('init ' + random + ' 0')
        ws.send('init ' + random + ' 1')
        settings.waiting = nil
      end
    end

    ws.on(:message) do |msg|
      next if msg.data == 'ping'
      next if ws.nil?
      next if settings.sockets.index(ws).nil?
      next if settings.sockets[settings.pairs[settings.sockets.index(ws)]].nil?

      settings.sockets[settings.pairs[settings.sockets.index(ws)]].send(msg.data) 
    end

    ws.on(:close) do |event|
      puts 'On Close'
      if !settings.pairs[my_index].nil?
        #this websocket has been paired
        other = settings.pairs[settings.sockets.index(ws)]
        settings.sockets[other] = nil
        settings.sockets[settings.sockets.index(ws)] = nil 
        settings.sockets.delete(ws)
      end
      ws = nil
    end

    ws.rack_response
  else
    erb :index
  end 
end

get '/highscore/:num' do
    current = IO.read('highscore').to_i
    if params[:num].to_i > current
        return if params[:num].to_i > current + 1
        IO.write('highscore', params[:num])
    end
    200
end
get '/highscore' do
    IO.read('highscore')
end

error Sinatra::NotFound do
  content_type 'text/plain'
  [404, 'Not Found']
end

not_found do
  status 404
  erb "404".to_sym
end

