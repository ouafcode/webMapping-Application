from flask import Flask
from flask_cors import CORS
from routes.service_area import service_bp # Import blueprint route
from routes.search_market import search_bp
from routes.routing import routing_bp
from routes.closest_markets import closet_bp

app = Flask(__name__)
CORS(app)

# Register blueprint
app.register_blueprint(service_bp)
app.register_blueprint(search_bp)
app.register_blueprint(routing_bp)
app.register_blueprint(closet_bp)

if __name__ == '__main__':
    app.run(debug=True)