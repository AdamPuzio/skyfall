Skyfall
=======

A simple Node.js server load monitor

Basic Installation:

1. Download or git clone to a server
2. Run: node app.js
3. Open up http://yourserver.com:3007 in your browser (e.g. http://localhost:3007 if using on your own machine)
4. Enter in the name, url (or ip) and port (defaults to 3007) into the form at the top and click 'Add'

That's it! You should see a widget displaying your server's load information, which updates every 2 seconds.

Don't feel like adding servers every time you go to the page? Create a file in config/ called default.js and put the following:

exports.servers = {
	'Display Name': 'localhost'
	, 'Server A': 'myserver.com:3007'
	, 'Server B': '123.45.6.78'
	, 'Server C': {address: 'myserver2.com', port: 3007}
};

By following this format, you can also create other config files that can be accessed via /stack/{config_name}. So, if you create a file called 'config/clouds.js', you can see just the servers in that config by going to http://yourserver.com:3007/stack/clouds.


Notes:
- While animation defaults to 'on' if you have 6 or less servers, the app runs much smoother if you turn animation off
- The app is idle unless someone is connected, so there is virtually no added strain to the system
- While the example shows running 'node app.js', we suggest using a module like forever to keep Skyfall running
- The app runs on port 3007, so you'll have to have that port open to you on every server you are accessing