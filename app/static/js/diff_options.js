diff_options = {
    "custom_algo": `
        <div class="mt-2">
            <a href="javascript:showAlgoStructure()">View algorithm structure needed to run</a>
        <\div>
        <div class="form-group mt-3 d-flex align-items-center">
            <div class="custom-file align-items-center d-flex">
                <input type="file" class="custom-file-input"  name="custom_algo_file" id="custom_algo_file" uk-tooltip="title: Please check the algorithm structure for the format in which the algorithm must be uploaded.; pos: right">
                <label class="custom-file-label" for="custom_algo_file">Upload file</label>
            </div>
        </div>
        <div class="form-check mt-2">
            <input class="form-check-input" type="checkbox" name="use_uploaded" value="" id="use_uploaded">
            <label class="form-check-label" for="defaultCheck1">
              Use uploaded algorithm
            </label>
        </div>
        <div class="mt-2">
            <a href="javascript:showExistingAlgo()">View previously uploaded algorithm</a>
        </div>
    `,
    "IC": `
        <div class="form-group row mt-3 d-flex align-items-center">
            <label for="inputEmail3" class="col-sm-5 col-form-label">Edge Threshold &nbsp;&nbsp;&nbsp;<span uk-icon="question" uk-tooltip="Rate of Infection"></span></label>
            <div class="col-sm-7">
                <input type="number" class="form-control" min="0" value="0.1" step="0.001" max="1" id="threshold" placeholder="beta" name="edge_threshold">
            </div>
        </div>
        <div class="form-group row mt-3 d-flex align-items-center">
            <label for="inputEmail3" class="col-sm-5 col-form-label">Max Iterations</label>
            <div class="col-sm-7">
                <input type="number" class="form-control" min="50" value="100" max="300" id="iterations" placeholder="Iterations" name="iterations">
            </div>
        </div>
        
    `, 
    "SI": `
        <div class="form-group row mt-3">
            <label for="inputEmail3" class="col-sm-5 col-form-label">beta &nbsp;&nbsp;&nbsp;<span uk-icon="question" uk-tooltip="Infection probability"></span></label>
            <div class="col-sm-7">
                <input type="number" class="form-control" min="0" value="0.05" step="0.001" max="1" id="beta" placeholder="beta" name="beta">
            </div>
        </div>
        <div class="form-group row mt-1 d-none">
            <label for="inputEmail3" class="col-sm-5 col-form-label">gamma &nbsp;&nbsp;&nbsp;<span uk-icon="question" uk-tooltip="Rate of Infection"></span></label>
            <div class="col-sm-7">
                <input type="number" class="form-control" min="0" value="0.05" step="0.001" max="1" id="gamma" placeholder="gamma" name="gamma">
            </div>
        </div>
                <div class="form-group row mt-3 d-flex align-items-center">
            <label for="inputEmail3" class="col-sm-5 col-form-label">Max Iterations </label>
            <div class="col-sm-7">
                <input type="number" class="form-control" min="50" value="100" max="300" id="iterations" placeholder="Iterations" name="iterations">
            </div>
        </div>
    `,
    "SIS": `
        <div class="form-group row mt-3">
            <label for="inputEmail3" class="col-sm-5 col-form-label">beta &nbsp;&nbsp;&nbsp;<span uk-icon="question" uk-tooltip="Infection probability"></span></label>
            <div class="col-sm-7">
                <input type="number" class="form-control" min="0" value="0.05" step="0.001" max="1" id="beta" placeholder="beta" name="beta">
            </div>
        </div>
        <div class="form-group row mt-1">
            <label for="inputEmail3" class="col-sm-5 col-form-label">lambda &nbsp;&nbsp;&nbsp;<span uk-icon="question" uk-tooltip="Recovery probability"></span></label>
            <div class="col-sm-7">
                <input type="number" class="form-control" min="0" value="0.05" step="0.001" max="1" id="lambda" placeholder="lambda" name="lambda">
            </div>
        </div>
                <div class="form-group row mt-3 d-flex align-items-center">
            <label for="inputEmail3" class="col-sm-5 col-form-label">Max Iterations </label>
            <div class="col-sm-7">
                <input type="number" class="form-control" min="50" value="100" max="300" id="iterations" placeholder="Iterations" name="iterations">
            </div>
        </div>
    `,
    "SIR": `
        <div class="form-group row mt-3">
            <label for="inputEmail3" class="col-sm-5 col-form-label">beta &nbsp;&nbsp;&nbsp;<span uk-icon="question" uk-tooltip="Infection probability"></span></label>
            <div class="col-sm-7">
                <input type="number" class="form-control" min="0" value="0.05" step="0.001" max="1" id="beta" placeholder="beta" name="beta">
            </div>
        </div>
        <div class="form-group row mt-1">
            <label for="inputEmail3" class="col-sm-5 col-form-label">gamma &nbsp;&nbsp;&nbsp;<span uk-icon="question" uk-tooltip="Removal probability"></span></label>
            <div class="col-sm-7">
                <input type="number" class="form-control" min="0" value="0.05" step="0.001" max="1" id="gamma" placeholder="gamma" name="gamma">
            </div>
        </div>
                <div class="form-group row mt-3 d-flex align-items-center">
            <label for="inputEmail3" class="col-sm-5 col-form-label">Max Iterations</label>
            <div class="col-sm-7">
                <input type="number" class="form-control" min="50" value="100" max="300" id="iterations" placeholder="Iterations" name="iterations">
            </div>
        </div>
    `
}

diff_options_2 = {
    "custom_algo": `
        <div class="form-group mt-3 d-flex align-items-center">
            <div class="custom-file align-items-center d-flex">
                <input type="file" class="custom-file-input"  name="custom_algo_file" id="custom_algo_file" uk-tooltip="title: Options to change and set initial infected nodes; pos: right" required>
                <label class="custom-file-label" for="custom_algo_file">Upload file</label>
            </div>
        </div>
        <div class="mt-2">
            <a href="javascript:showExistingAlgo()">View previously uploaded algorithm</a>
        <\div>
    `,
    "IC": `
        <div class="form-group row mt-3 d-flex align-items-center">
            <label for="inputEmail3" class="col-sm-5 col-form-label">Edge Threshold &nbsp;&nbsp;&nbsp;<span uk-icon="question" uk-tooltip="Rate of Infection"></span></label>
            <div class="col-sm-7">
                <input type="number" class="form-control" min="0" value="0.1" step="0.001" max="1" id="threshold" placeholder="beta" name="edge_threshold">
            </div>
        </div>        
    `, 
    "SI": `
        <div class="form-group row mt-3">
            <label for="inputEmail3" class="col-sm-5 col-form-label">beta &nbsp;&nbsp;&nbsp;<span uk-icon="question" uk-tooltip="Rate of Infection"></span></label>
            <div class="col-sm-7">
                <input type="number" class="form-control" min="0" value="0.05" step="0.001" max="1" id="beta" placeholder="beta" name="beta">
            </div>
        </div>
        <div class="form-group row mt-1">
            <label for="inputEmail3" class="col-sm-5 col-form-label">gamma &nbsp;&nbsp;&nbsp;<span uk-icon="question" uk-tooltip="Rate of Infection"></span></label>
            <div class="col-sm-7">
                <input type="number" class="form-control" min="0" value="0.05" step="0.001" max="1" id="gamma" placeholder="gamma" name="gamma">
            </div>
        </div>
        
    `,
    "SIS": `
        <div class="form-group row mt-3">
            <label for="inputEmail3" class="col-sm-5 col-form-label">beta &nbsp;&nbsp;&nbsp;<span uk-icon="question" uk-tooltip="Rate of Infection"></span></label>
            <div class="col-sm-7">
                <input type="number" class="form-control" min="0" value="0.05" step="0.001" max="1" id="beta" placeholder="beta" name="beta">
            </div>
        </div>
        <div class="form-group row mt-1">
            <label for="inputEmail3" class="col-sm-5 col-form-label">lambda &nbsp;&nbsp;&nbsp;<span uk-icon="question" uk-tooltip="Rate of Infection"></span></label>
            <div class="col-sm-7">
                <input type="number" class="form-control" min="0" value="0.05" step="0.001" max="1" id="lambda" placeholder="lambda" name="lambda">
            </div>
        </div>
       
    `,
    "SIR": `
        <div class="form-group row mt-3">
            <label for="inputEmail3" class="col-sm-5 col-form-label">beta &nbsp;&nbsp;&nbsp;<span uk-icon="question" uk-tooltip="Rate of Infection"></span></label>
            <div class="col-sm-7">
                <input type="number" class="form-control" min="0" value="0.05" step="0.001" max="1" id="beta" placeholder="beta" name="beta">
            </div>
        </div>
        <div class="form-group row mt-1">
            <label for="inputEmail3" class="col-sm-5 col-form-label">gamma &nbsp;&nbsp;&nbsp;<span uk-icon="question" uk-tooltip="Rate of Infection"></span></label>
            <div class="col-sm-7">
                <input type="number" class="form-control" min="0" value="0.05" step="0.001" max="1" id="gamma" placeholder="gamma" name="gamma">
            </div>
        </div>
    `,
    "ground": `
        <div class="form-group mt-3 d-flex align-items-center">
            <div class="custom-file align-items-center d-flex">
                <input type="file" class="custom-file-input"  name="ground_truth_file" id="ground_truth_file" uk-tooltip="title: Options to change and set initial infected nodes; pos: right">
                <label class="custom-file-label" for="ground_truth_file">Upload file</label>
            </div>
        </div>
    `
}

function showExistingAlgo(){
    window.open('/custom_algorithm')
}

function showAlgoStructure(){
    window.open('/custom_algo_structure')
}
