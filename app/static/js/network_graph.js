let width = window.innerWidth;
let viz_width = width;
let height = window.innerHeight;
let computed = false;

let fov = 40;
let near = 400;
let far = 50000;
let selectedIndex = -1;

// var stats = new Stats();
// stats.dom.style.cssText="position:absolute;top:0;right:0;cursor:pointer;opacity:0.9;z-index:10000"
// stats.showPanel( 2 ); // 0: fps, 1: ms, 2: mb, 3+: custom

// Set up camera and scene
let camera = new THREE.PerspectiveCamera(
  fov,
  width / height,
  near,
  far 
);

window.addEventListener('resize', () => {
  width = window.innerWidth;
  viz_width = width;
  height = window.innerHeight;

  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
})
// Add canvas
let container = document.getElementById('graph-view-inner')
let renderer = new THREE.WebGLRenderer();
// let controls = new THREE.OrbitControls( camera, renderer.domElement );
renderer.setSize(width, height);
container.appendChild(renderer.domElement);
// document.body.appendChild( stats.dom );

let zoom = d3.zoom()
  .scaleExtent([getScaleFromZ(far), getScaleFromZ(near)])
  .on('zoom', () =>  {
    let d3_transform = d3.event.transform;
    zoomHandler(d3_transform);
  });

let view = d3.select(renderer.domElement);
function setUpZoom() {
  view.call(zoom);    
  let initial_scale = getScaleFromZ(far/4);
  var initial_transform = d3.zoomIdentity.translate(viz_width/2, height/2).scale(initial_scale);    
  zoom.transform(view, initial_transform);
  camera.position.set(0, 0, far/4);
}
setUpZoom();

let circle_sprite= new THREE.TextureLoader().load(
  "https://fastforwardlabs.github.io/visualization_assets/circle-sprite.png"
)

let max_x = 0;
let max_y = 0;
let scene = new THREE.Scene();
let points;
let lines;
let max_degree;
let chroma_colors;
let diffusion_running = false
let diffusion_interval;
const streamingNodeLoaderWorker = new Worker("static/js/streaming-csv-parser.js");

streamingNodeLoaderWorker.onmessage = ({
    data: { items, totalBytes, finished }
}) => {
  // const node = items
  //   .map(d => ({
  //     id: d.id,
  //     x: 0,
  //     y: 0,
  //   }))
  // items.map( function(d){
  //   max_degree = d.max_degree
  //   chroma_colors = chroma.scale(['#8282ff','#000088']).mode('lch').colors(max_degree);
  // })
  // data.nodes = data.nodes.concat(node)
  const nodes = items.map(function(d){
    let node_to_return = { id: d.id, x:0, y:0, degree: parseInt(d.degree), label: d.label }
    max_degree = (max_degree>parseInt(d.degree))?max_degree:parseInt(d.degree);
    let out_edges = d.edges.split(" ")
    out_edges.map(function(e){
      e = String(e).trim()
      if(e==='' || e == '\n'){
        // Do nothing
      }
      else{
        data.links.push({ source: d.id, target: e })
      }
    })
    return node_to_return
  })
  data.nodes = data.nodes.concat(nodes)
  if (finished) {
    /*
    let nodes = []
    var max_degree = 0
    for (let itemsI = 0; itemsI < items.length; itemsI++) {
      //  console.log(items.length)
      let d = items[itemsI]
      let node_to_return = { id: d.id, x:0, y:0, degree: parseInt(d.degree), label: d.label }
      max_degree = (max_degree>parseInt(d.degree))?max_degree:parseInt(d.degree);
      let out_edges = d.edges.split(" ")
      for(let o = 0; o < out_edges.length; o++) {
        let e = String(out_edges[o]).trim()
        if (e == '') {}
        else {
          console.log(e)
          data.links.push({ source: d.id, target: e })
        }
      }
      nodes.push(node_to_return)
    }
    data.nodes = nodes
    */
    //console.log(Object.assign({}, data.nodes))
    //console.log(data.nodes)
    //console.log(data)
    // console.log(data)
    chroma_colors = chroma.scale([chroma('#000088').brighten(3).hex(), '#000088']).mode('lch').colors(max_degree);
    //console.log(data.links)
    //console.log(data.nodes)
    //console.log(nodes)
    d3.forceSimulation(data.nodes)
    .force("boundary", forceBoundary(0,0,250000,100000).strength(0.5))
    .force("charge", d3.forceManyBody().strength(-500))
    // .force('center',d3.forceCenter(width/2,height/2))
    .force("link", d3.forceLink(data.links).id(function(d){ return String(d.id) }).distance(20))
    .on('tick', ticked)
    .on('end', ended);

  }
};

function ticked() {}

function ended(){
    data.nodes.map( function(node){
      if(node.x > max_x){
        max_x = node.x;
      }
      else if(-node.x > max_x){
        max_x = -node.x;
      }

      if(node.y > max_y){
        max_y = node.y;
      }
      else if(-node.y > max_y){
        max_y = -node.y
      }
    })
    let pointsGeometry = new THREE.Geometry();
    let linesGeometry = new THREE.Geometry();
    let pointsMaterial = new THREE.PointsMaterial({
      size: 8,
      sizeAttenuation: false,
      vertexColors: THREE.VertexColors,
      map: circle_sprite,
      transparent: true
    });
    let linesMaterial = new THREE.LineBasicMaterial({
      color: 0xcfcfcf
    });
    let colors = [];
    let ref = {}
    ref.x = data.nodes[0].x
    ref.y = data.nodes[0].y;
    for(let i = 0; i<data.nodes.length; i++){
      data.nodes[i].x -= ref.x
      data.nodes[i].y -= ref.y
    }
    data.nodes.map( function(d){
      let vertex = new THREE.Vector3(d.x,d.y,0);
      pointsGeometry.vertices.push(vertex);
      let color = new THREE.Color(chroma_colors[d.degree-1]);
      colors.push(color)
    })

    for(let i=0; i<data.links.length; i++){
      let sourceVertex = new THREE.Vector3(data.links[i].source.x,data.links[i].source.y,0)
      linesGeometry.vertices.push(sourceVertex);
      let targetVertex = new THREE.Vector3(data.links[i].target.x,data.links[i].target.y,0)
      linesGeometry.vertices.push(targetVertex);
    }

    pointsGeometry.colors = colors;
    
    points = new THREE.Points(pointsGeometry, pointsMaterial);
    lines = new THREE.LineSegments(linesGeometry, linesMaterial);

    scene.add(points);
    scene.add(lines);
    scene.background = new THREE.Color(0xffffff);
    animate();

    function showIterationNum(keys,i){
      diffusion_interval = setInterval(function(){
        keys.map( function(key){
            iterations[key][i].map( function(node){
              points.geometry.colors[parseInt(node)] = new THREE.Color(color_array[parseInt(key)])
            })
            points.geometry.colorsNeedUpdate = true;
          });
          getDiffusionData(i)
      },1000)
    }

    document.getElementById('download_network_button').addEventListener('click', function(){
      downloadNetwork(data)
    });

    document.getElementById("start-diffusion").addEventListener("click", function() {
      if(iterations === undefined){
        alert("Please run an algorithm first.")
      }
      else{
	diffusion_running = !diffusion_running;
	if(diffusion_running){
        	let keys = Object.keys(iterations)
        	let num_iters = iterations[keys[0]].length
		document.getElementById('start-diffusion').setAttribute('uk-icon', 'pause')
        	// for(let i = 0; i < num_iters; i++){
        	//   console.log(i,diffusion_running)
        	//   showIterationNum(keys,i)
        	// }
        	let i = parseInt(document.getElementById("myBar").value);
        	diffusion_interval = setInterval(function(){
          	  keys.map( function(key){
              	  	iterations[key][i].map( function(node){
                		points.geometry.colors[parseInt(node)] = new THREE.Color(color_array[parseInt(key)])
              	  	})
              	  	points.geometry.colorsNeedUpdate = true;
            	  });
            	  getDiffusionData(i)
            	  i++;
        	},1000)
      	}
      	else if(diffusion_interval !== undefined){
        	document.getElementById('start-diffusion').setAttribute('uk-icon', 'play')
		window.clearInterval(diffusion_interval)
      	}
      }
    });

    document.getElementById('diffusion-step').addEventListener("click", function() {
      if(iterations === undefined) {
        alert("Please run an algorithm first.")
      }
      else{
        let i = parseInt(document.getElementById("myBar").value);
        let keys = Object.keys(iterations)
        keys.map(function(key){
          iterations[key][i].map( function(node) {
            points.geometry.colors[parseInt(node)] = new THREE.Color(color_array[parseInt(key)])
          })
          points.geometry.colorsNeedUpdate = true;
        });
        getDiffusionData(i)
        document.getElementById("myBar").value = i+1;
        document.getElementById("slider-time").value = i+1; 
      }
    })

    document.getElementById('reset-button').addEventListener("click", function() {
      if(diffusion_running){
        diffusion_running = ! diffusion_running;
      }
      document.getElementById('myBar').value = 0;
      document.getElementById("slider-time").innerHTML = "0";
      document.getElementById('download-iterations').classList.add('disabled')
      let elem = document.getElementById('nodes_appearance')
      let color_prev = document.getElementById('node_color').value
      while (elem.lastElementChild) {
          elem.removeChild(elem.lastElementChild);
      }
      // keys = Object.keys(iterations)
      // let heading = document.createElement('label');
      // heading.innerHTML = 'Diffusion Class colors';
      // heading.classList.add('uk-form-label')
      // elem.appendChild(heading);
      // elem.appendChild(document.createElement('br'))
      diffStats = document.getElementById('diffusion-stats')
      diffStats.innerHTML  = ''
      // Base color field
      let label_b = document.createElement('label')
      label_b.htmlFor = 'node_color';
      label_b.innerHTML = 'Set node color: ';
      let input_b = document.createElement('input');
      input_b.name = 'node_color'
      input_b.id = 'node_color'
      input_b.type = 'color'
      let space_b = document.createElement('span')
      space_b.innerHTML = "&nbsp;&nbsp;"
      elem.appendChild(label_b)
      elem.appendChild(space_b)
      elem.appendChild(input_b)
      elem.appendChild(document.createElement('br'))
      input_b.value = color_prev;
      setListenerAgainBASECOLOR();
      iterations = undefined;
      for(let i=0; i<points.geometry.colors.length; i++){
        let d = data.nodes[i];
        points.geometry.colors[i] = new THREE.Color(chroma_colors[d.degree-1]);
      }
      points.geometry.colorsNeedUpdate = true;
    });

    document.getElementById('myBar').addEventListener("input", function() {
      if(iterations === undefined){
        alert("Please run an algorithm first.")
      }
      else if(!diffusion_running){
        let final_pos = document.getElementById('myBar').value;
        let keys = Object.keys(iterations)
        let num_iters = iterations[keys[0]].length - 1;
        final_pos = (final_pos>num_iters)?num_iters:final_pos;
        if(final_pos == 0){
          for(let i=0; i<points.geometry.colors.length; i++){
            let d = data.nodes[i];
            points.geometry.colors[i] = new THREE.Color(chroma_colors[d.degree-1]);
          }
        }
        else{
          for(let i = 1; i<=final_pos; i++){
            keys.map(function(key){
              iterations[key][i-1].map(function(node){
                points.geometry.colors[parseInt(node)] = new THREE.Color(color_array[parseInt(key)]);
              });
            });
          }
        }
        points.geometry.colorsNeedUpdate = true;
      }
      else{
        alert("Please pause first.");
      }
    });

    document.getElementById("edge_color").addEventListener("change", function(){
        let x = document.getElementById("edge_color").value;
        lines.material.color = new THREE.Color(x)
        lines.material.needsUpdate = true
    })

    document.getElementById("canvas_color").addEventListener("change", function(){
      let x = document.getElementById("canvas_color").value;
      scene.background = new THREE.Color(x)
    })

    document.getElementById("node_color").addEventListener("change", function(){
      let x = document.getElementById("node_color").value;
      console.log(x)
      chroma_colors = chroma.scale([chroma(x).brighten(1).hex(), chroma(x).darken(1).hex()]).mode('lch').colors(max_degree)
      if(document.getElementById('myBar').value === '0'){
        for(let i = 0; i < points.geometry.colors.length; i++){
          if(chroma_colors.length < data.nodes[i].degree){
            console.log(chroma_colors.length, data.nodes[i].degree, i)
          }
          points.geometry.colors[i] = new THREE.Color(chroma_colors[data.nodes[i].degree - 1])
        }
        points.geometry.colorsNeedUpdate = true;
      }
    })

    console.log(points.geometry)
    let raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 50;

    container.addEventListener('mousemove', (event) => {
      let mouseX = event.clientX;
      let mouseY = event.clientY;
      checkIntersects([mouseX, mouseY])
    })

    container.addEventListener('click', (event) => {
      let mouseX = event.clientX;
      let mouseY = event.clientY;
      showSelectedNodeInfo([mouseX, mouseY])
    })

    function mouseToThree(mouseX, mouseY) {
      let canvasBounds = renderer.getContext().canvas.getBoundingClientRect();
      return new THREE.Vector3(
        ((mouseX - canvasBounds.left) / ( canvasBounds.right - canvasBounds.left ) * 2 - 1),
        (-((mouseY - canvasBounds.top) / (canvasBounds.bottom - canvasBounds.top)) * 2 + 1),
        1
      );
    }

    let selectContainer = new THREE.Object3D()
    scene.add(selectContainer);
    
    function showSelectedNodeInfo(mouse_position){
      let mouse_vector = mouseToThree(...mouse_position);
      raycaster.setFromCamera(mouse_vector, camera);
      let intersects = raycaster.intersectObject(points);
      if(intersects[0]){
        let sorted_intersects = sortIntersectsByDistanceToRay(intersects);
        let intersect = sorted_intersects[0];
        let index = intersect.index;
        let datum = data.nodes[index];
        if(selectedIndex === index){
          removeSelection();
          removeNodeInfo();
          selectedIndex = -1;
        }
        else{
          selectPoint(datum);
          getNodeInfo(data.nodes[index].id)
          selectedIndex = index;
        }
      }
    }

    function removeNodeInfo(){
      document.getElementById('sel-node-data').innerHTML = 'Select a node to view its details.';
    }

    function selectPoint(datum){
      removeSelection();
      let geometry = new THREE.Geometry();
      geometry.vertices.push(
        new THREE.Vector3(
          datum.x,
          datum.y,
          0
        )
      );
      geometry.colors = [ new THREE.Color('#000000') ];

      let material = new THREE.PointsMaterial({
        size: 20,
        sizeAttenuation: false,
        vertexColors: THREE.VertexColors,
        map: circle_sprite,
        transparent: true
      });
      
      let point = new THREE.Points(geometry, material);
      let geometry_1 = new THREE.Geometry();
      geometry_1.vertices.push(
        new THREE.Vector3(
          datum.x,
          datum.y,
          0
          )
      );
      geometry_1.colors = [ new THREE.Color(makeRandomColor()) ];
      
      let material_1 = new THREE.PointsMaterial({
        size: 14,
        sizeAttenuation: false,
        vertexColors: THREE.VertexColors,
        map: circle_sprite,
        transparent: true
      });
      
      let point_1 = new THREE.Points(geometry_1, material_1);
      selectContainer.add(point_1);
      selectContainer.add(point);
    }

    function removeSelection(){
      selectContainer.remove(...selectContainer.children);
    }

    function checkIntersects(mouse_position) {
      let mouse_vector = mouseToThree(...mouse_position);
      raycaster.setFromCamera(mouse_vector, camera);
      let intersects = raycaster.intersectObject(points);
      if (intersects[0]) {
        let sorted_intersects = sortIntersectsByDistanceToRay(intersects);
        let intersect = sorted_intersects[0];
        let index = intersect.index;
        let datum = data.nodes[index];
        highlightPoint(datum);
        showTooltip(mouse_position, datum);
      } else {
        removeHighlights();
        hideTooltip();
      }
    }

    function sortIntersectsByDistanceToRay(intersects) {
      return _.sortBy(intersects, "distanceToRay");
    }

    let hoverContainer = new THREE.Object3D()
    scene.add(hoverContainer);

    function highlightPoint(datum) {
      removeHighlights();
      let geometry = new THREE.Geometry();
      geometry.vertices.push(
        new THREE.Vector3(
          datum.x,
          datum.y,
          0
        )
      );
      geometry.colors = [ new THREE.Color('#000000') ];

      let material = new THREE.PointsMaterial({
        size: 14,
        sizeAttenuation: false,
        vertexColors: THREE.VertexColors,
        map: circle_sprite,
        transparent: true
      });
      
      let point = new THREE.Points(geometry, material);
      hoverContainer.add(point);
    }

    function removeHighlights() {
      hoverContainer.remove(...hoverContainer.children);
    }

    view.on("mouseleave", () => {
      removeHighlights()
    });

    // Initial tooltip state
    let tooltip_state = { display: "none" }

    let tooltip_template = document.createRange().createContextualFragment(`<div id="tooltip" class='rounded text-white' style="border-radius: 25px; display: none; position: absolute; pointer-events: none; font-size: 13px; width: 120px; text-align: center; line-height: 1; padding: 0px; background: #e2e2e2; " >
      <div id="point_tip" class='rounded' style="padding: 4px;"></div>
    </div>`);
    document.body.append(tooltip_template);

    let $tooltip = document.querySelector('#tooltip');
    let $point_tip = document.querySelector('#point_tip');

    function updateTooltip() {
      $tooltip.style.display = tooltip_state.display;
      $tooltip.style.left = tooltip_state.left + 'px';
      $tooltip.style.top = tooltip_state.top + 'px';
      $point_tip.innerText = `Label: ${tooltip_state.label}`;
      $point_tip.style.background = chroma_colors[tooltip_state.degree-1];
      // console.log(chroma_colors)
    }

    function showTooltip(mouse_position, datum) {
      let tooltip_width = 100;
      let x_offset = -tooltip_width/2;
      let y_offset = 15;
      tooltip_state.display = "block";
      tooltip_state.left = mouse_position[0] + x_offset;
      tooltip_state.top = mouse_position[1] + y_offset;
      tooltip_state.label = datum.label;
      tooltip_state.degree = datum.degree;
      updateTooltip();
    }

    function hideTooltip() {
      tooltip_state.display = "none";
      updateTooltip();
    }

    // Hide the initial loading screen
    document.getElementById('initial-black-screen').remove()

}

if(positioned === false){
  streamingNodeLoaderWorker.postMessage(filename);
}
else{
  data.nodes.map(function(d){
    max_degree = (max_degree>parseInt(d.degree))?max_degree:parseInt(d.degree);
  })
  chroma_colors = chroma.scale([chroma('#000088').brighten(3).hex(), '#000088']).mode('lch').colors(max_degree);
  ended()
}

// Three.js render loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  // stats.update()
}

function zoomHandler(d3_transform) {
  let scale = d3_transform.k;
  let x = -(d3_transform.x - viz_width/2) / scale;
  let y = (d3_transform.y - height/2) / scale;
  let z = getZFromScale(scale);
  camera.position.set(x, y, z);
}

function getScaleFromZ (camera_z_position) {
  let half_fov = fov/2;
  let half_fov_radians = toRadians(half_fov);
  let half_fov_height = Math.tan(half_fov_radians) * camera_z_position;
  let fov_height = half_fov_height * 2;
  let scale = height / fov_height; // Divide visualization height by height derived from field of view
  return scale;
}

function getZFromScale(scale) {
  let half_fov = fov/2;
  let half_fov_radians = toRadians(half_fov);
  let scale_height = height / scale;
  let camera_z_position = scale_height / (2 * Math.tan(half_fov_radians));
  return camera_z_position;
}

function toRadians (angle) {
  return angle * (Math.PI / 180);
}

function setListenerAgainBASECOLOR(){
  document.getElementById("node_color").addEventListener("change", function(){
    let x = document.getElementById("node_color").value;
    chroma_colors = chroma.scale([chroma(x).brighten(1).hex(), chroma(x).darken(1).hex()]).mode('lch').colors(max_degree)
    if(document.getElementById('myBar').value === '0'){
      for(let i = 0; i < points.geometry.colors.length; i++){
        if(chroma_colors.length < data.nodes[i].degree){
          console.log(chroma_colors.length, data.nodes[i].degree, i)
        }
        points.geometry.colors[i] = new THREE.Color(chroma_colors[data.nodes[i].degree - 1])
      }
      points.geometry.colorsNeedUpdate = true;
    }
  })
}

// controls.enableRotate = false;

function onZoomIn() {
	camera.position.set(camera.position.x, camera.position.y, camera.position.z - 1000)
}

function onZoomOut() {
	camera.position.set(camera.position.x, camera.position.y, camera.position.z + 1000)
}
