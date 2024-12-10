from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import os
import json

app = Flask(__name__)
CORS(app)


@app.route("/execute", methods=["POST"])
def execute_script():
    data = request.json
    # print(json.dumps(data, indent=2))
    column = data.get("column")
    column_values = data.get("columnValues")
    values = data.get("values")
    slider_min = data.get("sliderMin")
    slider_max = data.get("sliderMax")
    number_of_output_lines = data.get("numberOfOutputLines")
    bool_use_params = data.get("algoParams").get("toBeUsed")
    min_sup = data.get("algoParams").get("minSup")
    min_conf = data.get("algoParams").get("minConf")
    checkbox_data = data.get("checkBoxData")

    # Pass the values as environment variables to the script
    env_vars = {
        "VALUES": ",".join(values),
        "COLUMN_VALUES": ",".join(column_values),
        "COLUMN_INDEX": str(column),
        "SLIDER_MIN": str(slider_min),
        "SLIDER_MAX": str(slider_max),
        "NUMBER_OF_OUTPUT_LINES": str(number_of_output_lines),
        "BOOL_USE_PARAMS": str(bool_use_params),
        "MIN_SUP": str(min_sup),
        "MIN_CONF": str(min_conf),
        "CHECKBOX_DATA": ",".join(checkbox_data),
    }

    script_path = os.path.join(os.path.dirname(__file__), "scripts", "script_to_run.py")
    try:
        result = subprocess.run(
            ["python", script_path],
            capture_output=True,
            text=True,
            check=True,
            env={**os.environ, **env_vars},
        )
        print(f"Script output: {result.stdout}")
        return jsonify({"output": result.stdout})
    except subprocess.CalledProcessError as e:
        print(f"Script error: {e.stderr}")
        return jsonify({"error": e.stderr}), 500


if __name__ == "__main__":
    app.run(debug=True)
