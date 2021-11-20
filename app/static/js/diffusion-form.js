function makeRandomColor(){
  let c = '';
  while (c.length < 6) {
    c += (Math.random()).toString(16).substr(-6).substr(-1)
  }
  return '#'+c;
}

const modelDescriptors ={
	'IC': {
		state_labels:{
            0:"Susceptible",
            1:"Infected",
            2:"Removed"
      	},
      	type: 1,
	      nodeColor: chroma.scale(['#fafa6e','#2A4858'])
	      .mode('lch').colors(6)
	},
    'SI':{
      state_labels:{
        0:"Susceptible",
        1:"Infected"
      },
      type: 2,
      nodeColor: chroma.scale(['#fafa6e','#2A4858'])
      .mode('lch').colors(6)
      // .range(colorbrewer['RdYlBu'][3])
    },
    'SIR':{
      state_labels:{
            0:"Susceptible",
            1:"Infected",
            2:"Recovered"
      },
      type: 1,
      nodeColor: chroma.scale(['#fafa6e','#2A4858'])
      .mode('lch').colors(6)
      // .range(colorbrewer['RdYlBu'][3])
    },
    'SIS':{
      state_labels:{
        0:"Susceptible",
        1:"Infected"
      },
      type: 2,
      nodeColor: chroma.scale(['#fafa6e','#2A4858'])
      .mode('lch').colors(6)
      // .range(colorbrewer['RdYlBu'][3])
    },
    'SEIR':{
      state_labels:{
        0:"Susceptible",
        1:"Exposed",
        2:"Infected",
        3:"Recovered"
      },
      type: 3,
      nodeColor: chroma.scale(['#fafa6e','#2A4858'])
      .mode('lch').colors(6)
      // .range(colorbrewer['RdYlBu'][3])
    },
    'SEIS':{
      state_labels:{
        0:"Susceptible",
        1:"Exposed",
        2:"Infected"
      },
      type: 4,
      nodeColor: chroma.scale(['#fafa6e','#2A4858'])
      .mode('lch').colors(6)
      // .range(colorbrewer['RdYlBu'][3])
    },
    'Threshold':{
      state_labels:{
        0:"Susceptible",
        1:"Exposed",
        2:"Infected"
      },
      type: 4,
      nodeColor: chroma.scale(['#fafa6e','#2A4858'])
      .mode('lch').colors(6)
      // .range(colorbrewer['RdYlBu'][3])
    },
    'custom_algo':{
      state_labels:{
        0:"Susceptible",
        1:"Infected"
      },
      type: 2,
      nodeColor: chroma.scale(['#fafa6e','#2A4858'])
      .mode('lch').colors(6)
      // .range(colorbrewer['RdYlBu'][3])
    },
  
  }

numNodes  = document.getElementById('total-nodes')
numEdges  = document.getElementById('total-edges')
density   = document.getElementById('graph-density')
avgDegree = document.getElementById('graph-degree')

var iterations, iterations1, iterations2; 

var color_array = {}
var color_array_1 = {}
var color_array_2 = {}
var colors = ['#22ff22', '#ff2222', '#2222ff']
var colors_first = ['#800080', '#ffd700']
var labels = ['Susceptible', 'Infected', 'Recovered']
var labels_1234 = ['Susceptible', 'Infected', 'Recovered']

function sendData() {

    let diff_value = document.getElementById('select-diffusion').value
    let is_seed_nodes = document.getElementById('is_seed_nodes').checked
    let use_uploaded = document.getElementById('use_uploaded')
    if(use_uploaded === undefined){
      use_uploaded = true
    }
    let percent_infected = document.getElementById('percent_infected').value
    console.log(percent_infected)
    console.log(is_seed_nodes, percent_infected)
    const XHR = new XMLHttpRequest();

    // Bind the FormData object and the form element
    const FD = new FormData( form );
    FD.append('model', diff_value)
    FD.append('is_seed_nodes', is_seed_nodes)
    FD.append('fraction_infected', percent_infected)
    FD.append('use_uploaded', use_uploaded)
    FD.append('iterations', 100)
    // Define what happens on successful data submission
    XHR.addEventListener( "load", function(event) {
      let response = JSON.parse(event.target.responseText)
      document.getElementById('download-iterations').classList.remove('disabled')
      console.log(response)
      document.getElementById('submit-diffusion-btn').innerHTML = 'Run Diffusion'
      if(response['success'] == 0){
        $('#toast-status').toast({delay: 3000});
        $('#toast-status').toast('show')
        iterations = response['iterations']
        diffusionAvailable = true
        color_array = {}
        document.getElementById("myBar").max = iterations[0].length
        document.getElementById("myBar").value = 0
        let elem = document.getElementById('nodes_appearance')
        let color_prev = document.getElementById('node_color').value
        while (elem.lastElementChild) {
            elem.removeChild(elem.lastElementChild);
        }
        keys = Object.keys(iterations)
        let heading = document.createElement('label');
        heading.innerHTML = 'Diffusion Class colors';
        heading.classList.add('uk-form-label')
        elem.appendChild(heading);
        elem.appendChild(document.createElement('br'))
        diffStats = document.getElementById('diffusion-stats')
        diffStats.innerHTML  = ''
        // Base color field
        let label_b = document.createElement('label')
        label_b.htmlFor = 'node_color';
        label_b.innerHTML = 'Base color: ';
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
        // 
        keys.map(function(d){
            let label = document.createElement('label')
            label.htmlFor = `class_1_${d}_color`
            label.innerHTML = `${labels[d]} node color:  `
            let input = document.createElement('input')
            input.name = `class_1_${d}_color`
            input.id = `class_1_${d}_color`
            input.type = 'color'
            let space = document.createElement('span')
            space.innerHTML = "&nbsp;&nbsp;"
            elem.appendChild(label)
            elem.appendChild(space)
            elem.appendChild(input)
            elem.appendChild(document.createElement('br'))
            color_array[d] = colors[d];
            input.value = color_array[d]
            console.log('color = ' + color_array[d]);
            input.addEventListener('change', function(){
              color_array[d] = input.value
            })
            let statListItem = createListElement(d, d)
            diffStats.innerHTML += statListItem
        })
        plotData(response)
      }
      else{
        alert(response['msg'])
      }
      
    });

    // Define what happens in case of error
    XHR.addEventListener( "error", function( event ) {
      alert( 'Oops! Something went wrong.' );
    } );

    // Set up our request
    XHR.open( "POST", "/runmodel" );
    document.getElementById('submit-diffusion-btn').innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
    Running...`
    // The data sent is what the user provided in the form
    XHR.send( FD );

}

function sendSeedNodes() {
    let diff_value = document.getElementById('select-diffusion').value

    const XHR = new XMLHttpRequest();
    let seedForm = document.getElementById('seed-form')
    // Bind the FormData object and the form element
    const FD = new FormData( seedForm );
    // Define what happens on successful data submission
    XHR.addEventListener( "load", function(event) {
      let response = JSON.parse(event.target.responseText)
      console.log(response)
      if(response['success'] == 1){
        alert(response['msg'])
      }
    } );

    // Define what happens in case of error
    XHR.addEventListener( "error", function( event ) {
      alert( 'Oops! Something went wrong.' );
    } );

    // Set up our request
    XHR.open( "POST", "/api/uploadSeedNodes" );

    // The data sent is what the user provided in the form
    XHR.send( FD );    
}

function getBasicGraphInfo() {
    const XHR = new XMLHttpRequest();
    // Define what happens on successful data submission
    XHR.addEventListener( "load", function(event) {
      //alert( event.target.responseText );
        let response = JSON.parse(event.target.responseText)
        numNodes.innerText  = response['numNodes']
        numEdges.innerText  = response['numEdges']
        density.innerText   = response['density'].toFixed(4)
        avgDegree.innerText = response['degree'].toFixed(4)
        degree_hist = response['degree_hist']
        degree_hist_labels = []
        loglogScatter = []
        for (let i = 0; i < degree_hist.length; i++) {
            degree_hist_labels.push(i)
            //degree_hist[i] = parseInt(degree_hist[i])
            if (degree_hist[i] != 0)
            loglogScatter.push({x: i, y: degree_hist[i]})
        }
        console.log(degree_hist)
        // Not being plotted anymore.
        var ctx = document.getElementById('degree-plot').getContext('2d');
        var chart = new Chart(ctx, {
            // The type of chart we want to create
            type: 'scatter',

            // The data for our dataset
            data: {
                labels: degree_hist_labels,
                datasets: [{
                    label: 'Power law degree distribution',
                    backgroundColor: 'rgb(255, 99, 132)',
                    borderColor: 'rgb(255, 99, 132)',
                    data: loglogScatter,
                    fill: false,
                }]
            },

            // Configuration options go here
            options: {
                aspectRatio: 1.2,
                scales: {
                  xAxes: [{
                    type: 'logarithmic',
                    scaleLabel:
                    {
                      labelString: 'Degree',
                    display: true,
                    }
                    
                  }],
                  yAxes:[{
                      type:'logarithmic',
                      scaleLabel:
                      {
                        labelString: 'Number of nodes',
                        display: true,
                      }
                      
                  }]
                }
            }
        });
    } );

    // Define what happens in case of error
    XHR.addEventListener( "error", function( event ) {
      alert( 'Oops! Something went wrong.' );

    } );

    // Set up our request
    XHR.open( "POST", "/api/basicInfo" );

    // The data sent is what the user provided in the form
    XHR.send();    
}

function getFilter(filter) {
    const XHR = new XMLHttpRequest();
    // Bind the FormData object and the form element
    const FD = new FormData();
    FD.append('filter', filter)
    // Define what happens on successful data submission
    XHR.addEventListener( "load", function(event) {
      //alert( event.target.responseText );
        let response = JSON.parse(event.target.responseText)
        if (response['success'] == 0) {
          try {
            document.getElementById(`filter-${filter}`).innerHTML = response['filter'].toFixed(3)
            document.getElementById(`filter-${filter}-btn`).style.display = 'none'
          } catch {
            document.getElementById(`filter-${filter}`).innerHTML = response['filter']
            document.getElementById(`filter-${filter}-btn`).style.display = 'none'
          }
            
        } else {
            alert(`Couldn't calculate ${filter} for your graph`)
        }
    } );

    // Define what happens in case of error
    XHR.addEventListener( "error", function( event ) {
      alert( 'Oops! Something went wrong.' );
    } );

    // Set up our request
    XHR.open( "POST", "/api/runFilter" );

    // The data sent is what the user provided in the form
    XHR.send( FD );   
}

function startCompare() {
    let diff_value_1 = document.getElementById('select-diffusion-1').value
    let diff_value_2 = document.getElementById('select-diffusion-2').value
    let is_seed_nodes = document.getElementById('is_seed_nodes').checked
    let percent_infected = document.getElementById('percent_infected').value
    const XHR = new XMLHttpRequest();

    // Bind the FormData object and the form element
    const FD = new FormData();
    FD.append('model_1', diff_value_1)
    FD.append('model_2', diff_value_2)
    FD.append('is_seed_nodes', is_seed_nodes)
    FD.append('fraction_infected', percent_infected)
    FD.append('iterations', document.getElementById('iterations').value)
    const form1 = document.getElementById( "diff-form-1" );
    const form2 = document.getElementById( "diff-form-2" );
    const formData1 = new FormData(form1)
    const formData2 = new FormData(form2)
    let params1 = {}
    for (var pair of formData1.entries()) {
        params1[pair[0]] = pair[1] 
    }
    let params2 = {}
    for (var pair of formData2.entries()) {
        params2[pair[0]] = pair[1] 
    }
    FD.append('params1', JSON.stringify(params1))
    FD.append('params2', JSON.stringify(params2))
    // Define what happens on successful data submission
    XHR.addEventListener( "load", function(event) {
      let responseMain = JSON.parse(event.target.responseText)
      console.log(responseMain)
      //
      diffusionAvailable = true
      result1 = {'msg': responseMain['model1'], 'iterations': responseMain['iterations1']}
      result2 = {'msg': responseMain['model2'], 'iterations': responseMain['iterations2']}
      iterations1 = result1['iterations']
      iterations2 = result2['iterations']
      console.log(1,iterations1)
      console.log(2,iterations2)
      timelineDataGlobal1 = iterations1
      timelineDataGlobal2 = iterations2
      document.getElementById("myBar").max = iterations1[0].length
      document.getElementById("myBar").value = 0
      let data1 = plotData(result1, 'RetweetReport1')
      let data2 = plotData(result2, 'RetweetReport2')
      compareInfection('CompareInfectionReport', data1, data2)
      plotF1()
      plotF1outside()
      color_array_1 = {}
      color_array_2 = {}

      let elem = document.getElementById('nodes_appearance_compare')
      while (elem.lastElementChild) {
          elem.removeChild(elem.lastElementChild);
      }

      keys1 = Object.keys(iterations1)
      let heading1 = document.createElement('label');
      heading1.innerHTML = 'Algorithm 1 class colors';
      heading1.classList.add('uk-form-label')
      elem.appendChild(heading1);
      elem.appendChild(document.createElement('br'));
      diffStats = document.getElementById('diffusion-stats')
      diffStats.innerHTML  = ''
      diffStats.innerHTML  += '<li>Algorithm 1</li>'
      keys1.map(function(d){
          let label = document.createElement('label')
          label.htmlFor = `class_1_${d}_color`
          label.innerHTML = `${labels_1234[d]} color: `
          let input = document.createElement('input')
          input.name = `class_1_${d}_color`
          input.id = `class_1_${d}_color`
          input.type = 'color'
          elem.appendChild(label)
          elem.appendChild(input)
          elem.appendChild(document.createElement('br'))
          color_array_1[d] = colors_first[d]
          input.value = color_array_1[d]
          input.addEventListener('change', function(){
            color_array_1[d] = input.value
          })
          let statListItem = createListElement(d, d, 1)
          diffStats.innerHTML += statListItem
      })
      diffStats.innerHTML  += '<li>Algorithm 2</li>'
      keys2 = Object.keys(iterations2)
      let heading2 = document.createElement('label');
      heading2.innerHTML = 'Algorithm 2 class colors';
      heading2.classList.add('uk-form-label')
      elem.appendChild(heading2);
      elem.appendChild(document.createElement('br'));
      console.log('labels',labels)
      keys2.map(function(d){
          let label = document.createElement('label')
          label.htmlFor = `class_2_${d}_color`
          label.innerHTML = `${labels_1234[d]} color: `
          let input = document.createElement('input')
          input.name = `class_2_${d}_color`
          input.id = `class_2_${d}_color`
          input.type = 'color'
          elem.appendChild(label)
          elem.appendChild(input)
          elem.appendChild(document.createElement('br'))
          color_array_2[d] = colors[d]
          input.value = color_array_2[d]
          input.addEventListener('change', function(){
            color_array_2[d] = input.value
          })
          let statListItem = createListElement(d, d, 2)
          diffStats.innerHTML += statListItem
      })
    });

    // Define what happens in case of error
    XHR.addEventListener( "error", function( event ) {
      alert( 'Oops! Something went wrong.' );
    } );

    // Set up our request
    XHR.open( "POST", "/compareModel" );

    // The data sent is what the user provided in the form
    XHR.send( FD );

}

function getNodeInfo(id) {
  const XHR = new XMLHttpRequest();
  // Bind the FormData object and the form element
  const FD = new FormData();
  FD.append('id', id)
  // Define what happens on successful data submission
  XHR.addEventListener( "load", function(event) {
    //alert( event.target.responseText );
      let response = JSON.parse(event.target.responseText)
      let context_data = document.getElementById('sel-node-data');
      context_data.innerHTML = `<li><span class="bold-text">Label: </span><span id="total-nodes">${response['Label']}</span></li>`
      let keys_node_data = Object.keys(response)
      keys_node_data.map(function(d){
        if(d!=='Label'){
          context_data.innerHTML += `<li><span class="bold-text">${d}: </span><span id="total-nodes">${response[d]}</span></li>`
        }
      })
      document.getElementById('selected-node-accordian').classList.add('accordian-active');
      document.getElementById('selected-node-panel').style.display = "block";
  } );

  // Define what happens in case of error
  XHR.addEventListener( "error", function( event ) {
    alert( 'Oops! Something went wrong.' );
  } );

  // Set up our request
  XHR.open( "POST", "/api/getNodeInfo" );

  // The data sent is what the user provided in the form
  XHR.send( FD );   
}

function downloadNetwork(data) {
  const XHR = new XMLHttpRequest();
  // Bind the FormData object and the form element
  const FD = new FormData();
  FD.append('positioned',JSON.stringify(data))
  // XHR.setRequestHeader('Content-Type', 'application/json');
  // Define what happens on successful data submission
  XHR.addEventListener( "load", function(event) {
    //alert( event.target.responseText );
      // let response = JSON.parse(event.target.responseText)
      console.log(event)
      // let context_data = document.getElementById('sel-node-data');
      // context_data.innerHTML = `<li><span class="bold-text">Label: </span><span id="total-nodes">${response['Label']}</span></li>`
      // let keys_node_data = Object.keys(response)
      // keys_node_data.map(function(d){
      //   if(d!=='Label'){
      //     context_data.innerHTML += `<li><span class="bold-text">${d}: </span><span id="total-nodes">${response[d]}</span></li>`
      //   }
      // })
  } );

  // Define what happens in case of error
  XHR.addEventListener( "error", function( event ) {
    alert( 'Oops! Something went wrong.' );
  } );

  XHR.onreadystatechange = function(){
    if (this.readyState == 4 && this.status == 200){
        var blob = new Blob([this.response], {type: "application/zip"});
        var url = window.URL.createObjectURL(blob);
        var link = document.createElement('a');
        document.body.appendChild(link);
        link.style = "display: none";
        link.href = url;
        link.download = "network.diva";
        link.click();

        setTimeout(() => {
        window.URL.revokeObjectURL(url);
        link.remove(); } , 100);
    }
  };
  // Set up our request
  XHR.open( "POST", "/download_network" );
  XHR.responseType = "blob";
  // The data sent is what the user provided in the form
  XHR.send( FD );   
}

  // Access the form element...

// ...and take over its submit event.
const form = document.getElementById( "diff-form");
if(form !== null){
  form.addEventListener( "submit", function ( event ) {
    event.preventDefault();

    sendData();
  } );
}

function createListElement(name, id, extra = "") {
  if (extra == "")
    return `<li><span class="bold-text"># ${labels_1234[id]}: </span><span id="class_${id}_stat">-</span></li>`
  else return `<li><span class="bold-text"># ${labels_1234[id]}: </span><span id="class_${id}_stat_${extra}">-</span></li>`
}