from flask import Blueprint, request, jsonify
import psycopg2
from psycopg2.extras import RealDictCursor
import os

routing_bp = Blueprint("route", __name__) #Define a blueprint

#Load DB credentials
file_path = "C:\wamp64\www\market_analytics\webMapping-Application\services\db.credentials"

# file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".\db_credentials")
with open(file_path) as f:
    conn_str = f.readline().strip()
 
@routing_bp.route('/short_route', methods=['GET', 'POST'])
def short_route():
    try:
        # Get query parameters
        source = request.values.get('source');
        target = request.values.get('target');
        srid = int(request.values.get('srid'));

        source = source.split(",");
        target = target.split(",");

        # Connect to PostgreSQL
        pg_conn = psycopg2.connect(conn_str);
        pg_cur = pg_conn.cursor(cursor_factory=RealDictCursor)

        # Execute query
        def get_closest_node(coord, srid):
            query = """
                SELECT id, ST_Distance(ST_Transform(the_geom, %s), ST_SetSRID(ST_MakePoint(%s, %s), %s))
                FROM vector.bi_main_roads_vertices_pgr
                ORDER BY 2 ASC
                LIMIT 1
            """%(srid,float(coord[0]), float(coord[1]), srid)

            pg_cur.execute(query)
            records = pg_cur.fetchall()
            if len(records) > 0:
                return records[0]

        
        def get_shortest_path(source_coord, target_coord, srid):
            origin_node = get_closest_node(source_coord, srid)
            target_node = get_closest_node(target_coord, srid)
            if origin_node is None or target_node is None:
                return None

            origin_id = origin_node["id"]
            target_id = target_node["id"]
            query = """
              SELECT ST_AsGeoJSON(ST_Transform(ST_Union(geom), %s)):: json as path,
                      SUM(ST_Length(geom)) as distance 
              FROM vector.bi_main_roads
              WHERE gid IN (
              SELECT edge
              FROM pgr_dijkstra(
                'SELECT gid , id, source, target, cost FROM vector.bi_main_roads'::text,
                    %s, %s, false
                    )
                )
              """%(srid, int(origin_id), int(target_id))
            
            pg_cur.execute(query)
            records = pg_cur.fetchall()

            if len(records) > 0:
                return jsonify(records[0])
            else :
                return "No data found", 404
        # Get result of operation
        path = get_shortest_path(source, target, srid)
        pg_conn.close()
        return path


    except Exception as e:
        return f"Error: {str(e)}", 500
