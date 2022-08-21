

// 4 types of algorithms

function showReport(data, id='RetweetReport') {
	//update = JSON.parse(xhr.responseText)
    console.log(data)
    
    timelineData = []
    tempTimeLine = []
    let update = data['iterations']
    timelineDataGlobal = data['iterations']
    console.log("UPDATE", update)
    let model = data['msg']
    let description = modelDescriptors[model]
    if (description['type'] == 1) {
    	timelineData = []
	    tempTimeLine = []	
	    timelineData.push(JSON.parse(JSON.stringify(tempTimeLine)))
	    susceptibleUsers = update[0]
	    console.log(susceptibleUsers)
	    totalSusceptibleUsers = update[0][0].length
	    removedUsers = update[2]
	    infectedUsers = update[1]
	    for(let i = 0; i < infectedUsers.length; i++) {
	        var tempKeys = infectedUsers[i]
	        for (let k = 0; k < tempKeys.length; k++) {
	            tempTimeLine.push(tempKeys[k])
	        }
	        //console.log(tempTimeLine)
	        timelineData.push(Array.from(tempTimeLine))
	    }
	    let dataset = [{
	        x: 0,
	        y: timelineData[0].length,
	    }]
	    let labels = []
	    let secondDataset = [{
	        x: 0,
	        y: timelineData[0].length,
	    }]
	    let thirdDataset = [{
	        x: 0, y: susceptibleUsers[0].length
	    }]
	    susceptibleMap = {}
	    susceptibleUsers[0].forEach(element => {
	        susceptibleMap[element] = 'YES'
	    });
	    console.log(susceptibleMap)
	    let susceptibleLength = susceptibleUsers[0].length
	    for(let i = 1; i < timelineData.length - 1; i++){
	        dataset.push({
	            x: i,
	            y: timelineData[i].length,
	        })
	        secondDataset.push({
	            x: i,
	            y: timelineData[i].length - timelineData[i-1].length,
	        })
	        console.log(i)
	        for (let x = 0; x < infectedUsers[i].length; x++) {
	            delete susceptibleMap[infectedUsers[i][x]]
	        }
	        for (let x = 0; x < removedUsers[i].length; x++) {
	            delete susceptibleMap[infectedUsers[i][x]]
	        }
	        for (let x = 0; x < susceptibleUsers[i].length; x++) {
	            susceptibleMap[susceptibleUsers[i][x]] = "YES"
	        }
	        susceptibleLength = Object.keys(susceptibleMap).length 
	        console.log(susceptibleMap)
	        thirdDataset.push({
	            x: i,
	            y: susceptibleLength 
	        })
	        labels.push(i)
	    }
	    var ctx = document.getElementById(id).getContext('2d');
	    var chart = new Chart(ctx, {
	        // The type of chart we want to create
	        type: 'line',

	        // The data for our dataset
	        data: {
	            labels: labels,
	            datasets: [
	                {
	                    label: `# of ${description['state_labels'][1]} nodes`,
	                    // backgroundColor: 'rgb(255, 99, 132)',
	                    borderColor: 'rgb(255, 99, 132)',
	                    data: dataset
	                },
	                {
	                    label: `# of ${description['state_labels'][2]} nodes`,
	                    borderColor: 'rgb(132, 99, 255)',
	                    data: secondDataset
	                },
	                {
	                    label: `# of ${description['state_labels'][0]} nodes`,
	                    borderColor: 'rgb(132, 255, 92)',
	                    data: thirdDataset
	                }
	            ]
	        },

	        // Configuration options go here
	        options: {
	        	title: {
		            display: true,
		            text: `Epidemic Graph for ${model}`
		        }
        	}
   		});	
    } else if (description['type'] == 2) {
      timelineData = []
      tempTimeLine = [] 
      timelineData.push(JSON.parse(JSON.stringify(tempTimeLine)))
      susceptibleUsers = update[0]
      console.log(susceptibleUsers)
      totalSusceptibleUsers = update[0][0].length
      infectedUsers = update[1]
      for(let i = 0; i < infectedUsers.length; i++) {
          var tempKeys = infectedUsers[i]
          for (let k = 0; k < tempKeys.length; k++) {
              tempTimeLine.push(tempKeys[k])
          }
          //console.log(tempTimeLine)
          timelineData.push(Array.from(tempTimeLine))
      }
      let dataset = [{
          x: 0,
          y: timelineData[0].length,
      }]
      let labels = []
      let thirdDataset = [{
          x: 0, y: susceptibleUsers[0].length
      }]
      susceptibleMap = {}
      susceptibleUsers[0].forEach(element => {
          susceptibleMap[element] = 'YES'
      });
      console.log(susceptibleMap)
      let susceptibleLength = susceptibleUsers[0].length
      for(let i = 1; i < timelineData.length - 1; i++){
          dataset.push({
              x: i,
              y: timelineData[i].length,
          })
          console.log(i)
          for (let x = 0; x < infectedUsers[i].length; x++) {
              delete susceptibleMap[infectedUsers[i][x]]
          }
          for (let x = 0; x < susceptibleUsers[i].length; x++) {
              susceptibleMap[susceptibleUsers[i][x]] = "YES"
          }
          susceptibleLength = Object.keys(susceptibleMap).length 
          console.log(susceptibleMap)
          thirdDataset.push({
              x: i,
              y: susceptibleLength 
          })
          labels.push(i)
      }
      var ctx = document.getElementById(id).getContext('2d');
      var chart = new Chart(ctx, {
          // The type of chart we want to create
          type: 'line',

          // The data for our dataset
          data: {
              labels: labels,
              fill: false,
              datasets: [
                  {
                      label: `# of ${description['state_labels'][1]} nodes`,
                      // backgroundColor: 'rgb(255, 99, 132)',
                      borderColor: 'rgb(255, 99, 132)',
                      data: dataset
                  },
                  {
                      label: `# of ${description['state_labels'][0]} nodes`,
                      borderColor: 'rgb(132, 255, 92)',
                      data: thirdDataset
                  }
              ]
          },

          // Configuration options go here
          options: {
            title: {
                display: true,
                text: `Epidemic Graph for ${model}`
            }
          }
      }); 
    } else if (description['type'] == 3) {

    } else {

    }
    //timelineValue = 0
    //timeline_.value = 0

    //console.log(timelineData)
    //showRetweetReport(timelineData, susceptibleUsers, removedUsers, infectedUsers)
}

function plotData(data, id='RetweetReport') {
    var labels = []
    let totalLen = data['iterations'][0].length
    timelineDataGlobal = data['iterations']
    let allClasses = Object.keys(timelineDataGlobal)
    let datasets = [

    ]
    console.log(allClasses)
    let startTime = 0
    let statuses = {}
    let answer = {}
    for (let i = 0; i < allClasses.length; i++) {
        answer[i] = 0
    }
    for (let i = 0; i < allClasses.length; i++) {
        datasets.push([])
    }
    for (let j = 0; j < totalLen; j++) {
        for (let i = 0; i < allClasses.length; i++) {
            answer[i] = 0
        }
        for (let i = 0; i < allClasses.length; i++) {
            timelineDataGlobal[i][j].map(function(d) {
                statuses[d] = i
            })
        } 
        let statusKeys = Object.keys(statuses)
        for (let i = 0; i < statusKeys.length; i++) {
            answer[statuses[statusKeys[i]]] += 1
        }
        for (let i = 0; i < allClasses.length; i++) {
            datasets[i].push({
                x: j,
                y: answer[i]
            })
        }
        labels.push(j)
    }
    let model = data['msg']
    let description = modelDescriptors[model]
    console.log(description)
    let finalDatasets = []
    let colors = ['rgb(132, 255, 92)', 'rgb(255, 99, 132)', 'rgb(132, 92, 255)']
    for (let i = 0; i < allClasses.length; i++) {
        finalDatasets.push({
            label: `# of ${description['state_labels'][i]} nodes`,
            borderColor: colors[i],
            data: datasets[i]
        })
    }
    document.getElementById(`${id}-holder`).innerHTML = ""
    document.getElementById(`${id}-holder`).innerHTML = `<canvas id=${id} style="position: relative; height:40vh; width:50vw"></canvas>`
    var ctx = document.getElementById(id).getContext('2d');
    ctx.innerHTML = ""
    var chart = new Chart(ctx, {
        // The type of chart we want to create
        type: 'line',
        // The data for our dataset
        data: {
            fill: false,
            labels: labels,
            datasets: finalDatasets
        },

        // Configuration options go here
        options: {
          title: {
              display: true,
              text: `Epidemic Graph for ${model}`
          },
          scales: {
            xAxes: [{
              scaleLabel:
              {
                labelString: 'Iterations',
              display: true,
              }
              
            }],
            yAxes: [{
                scaleLabel:
                {
                  labelString: '# of Nodes',
                display: true,
                }
                
            }],
          }
        }
    });        
    return [finalDatasets, model, labels]
}

function compareInfection(id, data1, data2) {
    console.log("DATA: ", data1)
    dataset1 = Object.assign({}, data1[0][1])
    dataset2 = Object.assign({}, data2[0][1])
    model1 = data1[1]
    model2 = data2[1]
    dataset1.label = `# of infected nodes ${model1} (1)`
    dataset2.label = `# of infected nodes ${model2} (2)`
    dataset2.borderColor = 'rgb(255, 132, 92)'
    console.log('dataset1, ',  dataset1)
    var labels = data1[2]
    var ctx = document.getElementById(id).getContext('2d');
      var chart = new Chart(ctx, {
          // The type of chart we want to create
          type: 'line',

          // The data for our dataset
          data: {
              labels: labels,
              fill: false,
              datasets: [
                  dataset1,
                  dataset2
              ]
          },

          // Configuration options go here
          options: {
            title: {
                display: true,
                text: 'Comparison of number infected nodes'
            }
          }
      }); 
  }

function plotF1() {
    // plotF1Report
    let allClasses1 = Object.keys(timelineDataGlobal1)
    let allClasses2 = Object.keys(timelineDataGlobal2)
    //console.log(allClasses)
    let iterationCount = timelineDataGlobal1[0].length
    let startTime = 0
    let statuses1 = {}
    let statuses2 = {}
    let f1Dataset = []
    let tpDataset = []
    F1Array = []
    labels = []
    for (let j = 0; j < iterationCount; j++) {
        for (let i = 0; i < allClasses1.length; i++) {
            timelineDataGlobal1[i][j].map(function(d) {
                statuses1[d] = i
            })
        } 
        for (let i = 0; i < allClasses2.length; i++) {
            timelineDataGlobal2[i][j].map(function(d) {
                statuses2[d] = i
            })
        } 
        let infectedSet1 = new Set()
        let infectedSet2 = new Set()
        Object.keys(statuses2).map(function(d) {
            if (statuses2[d] == 1) {
                infectedSet2.add(d)
            }
        })     
        Object.keys(statuses1).map(function(d) {
            if (statuses1[d] == 1) {
                infectedSet1.add(d)
            }
        })         
        
        tpSet = intersection(infectedSet2, infectedSet1)
        fpSet = difference(infectedSet1, infectedSet2)
        fnSet = difference(infectedSet2, infectedSet1)
        //tnSet = intersection(infectedSet2, infectedSet1)
        precision = tpSet.size/(tpSet.size + fpSet.size)
        recall = tpSet.size/(tpSet.size + fnSet.size)
        f1Score = (2*precision*recall)/(precision+recall)
        //document.getElementById('tp_stat').innerHTML = tpSet.size
        //document.getElementById('fp_stat').innerHTML = fpSet.size
       // document.getElementById('fn_stat').innerHTML = fnSet.size
        //document.getElementById('precision_stat').innerHTML = precision
        //document.getElementById('recall_stat').innerHTML = recall
        //document.getElementById('f1_stat').innerHTML = f1Score
        precision = (isNaN(precision) ? 0 : precision)
        recall = (isNaN(recall) ? 0 : recall)
        f1Score = (isNaN(f1Score) ? 0 : f1Score)
        f1Dataset.push({
            x: j,
            y: f1Score
        })
        tpDataset.push({
            x: j,
            y: tpSet.size
        })
        F1Array.push(f1Score)
        labels.push(j)
    }

    var ctx = document.getElementById('plotF1Report').getContext('2d');
    var chart = new Chart(ctx, {
          // The type of chart we want to create
          type: 'line',

          // The data for our dataset
          data: {
                labels: labels,
                fill: false,
                datasets: [
                {
                    label: `F1 Score at each iteration`,
                    // backgroundColor: 'rgb(255, 99, 132)',
                    borderColor: 'rgb(255, 99, 132)',
                    data: f1Dataset,
                },
                
                ]
          },

          // Configuration options go here
          options: {
            title: {
                display: true,
                text: 'F1 Score at each iteration'
            }
          }
      }); 
      var ctx = document.getElementById('plotCommonNodes').getContext('2d');
    var chart = new Chart(ctx, {
          // The type of chart we want to create
          type: 'line',

          // The data for our dataset
          data: {
                labels: labels,
                fill: false,
                datasets: [
                    {
                        label: `# of nodes at iteration `,
                        // backgroundColor: 'rgb(255, 99, 132)',
                        borderColor: 'rgb(60, 40, 250)',
                        data: tpDataset,
                    }
                ]
          },

          // Configuration options go here
          options: {
            title: {
                display: true,
                text: 'Common Infected Nodes at each iteration'
            }
          }
      }); 
    //plotCommonNodes
}

function plotF1outside() {
    // plotF1Report
    let allClasses1 = Object.keys(timelineDataGlobal1)
    let allClasses2 = Object.keys(timelineDataGlobal2)
    //console.log(allClasses)
    let iterationCount = timelineDataGlobal1[0].length
    let startTime = 0
    let statuses1 = {}
    let statuses2 = {}
    let f1Dataset = []
    let tpDataset = []
    F1Array = []
    labels = []
    for (let j = 0; j < iterationCount; j++) {
        for (let i = 0; i < allClasses1.length; i++) {
            timelineDataGlobal1[i][j].map(function(d) {
                statuses1[d] = i
            })
        } 
        for (let i = 0; i < allClasses2.length; i++) {
            timelineDataGlobal2[i][j].map(function(d) {
                statuses2[d] = i
            })
        } 
        let infectedSet1 = new Set()
        let infectedSet2 = new Set()
        Object.keys(statuses2).map(function(d) {
            if (statuses2[d] == 1) {
                infectedSet2.add(d)
            }
        })     
        Object.keys(statuses1).map(function(d) {
            if (statuses1[d] == 1) {
                infectedSet1.add(d)
            }
        })         
        
        tpSet = intersection(infectedSet2, infectedSet1)
        fpSet = difference(infectedSet1, infectedSet2)
        fnSet = difference(infectedSet2, infectedSet1)
        //tnSet = intersection(infectedSet2, infectedSet1)
        precision = tpSet.size/(tpSet.size + fpSet.size)
        recall = tpSet.size/(tpSet.size + fnSet.size)
        f1Score = (2*precision*recall)/(precision+recall)
        precision = (isNaN(precision) ? 0 : precision)
        recall = (isNaN(recall) ? 0 : recall)
        f1Score = (isNaN(f1Score) ? 0 : f1Score)
        //document.getElementById('tp_stat').innerHTML = tpSet.size
        //document.getElementById('fp_stat').innerHTML = fpSet.size
       // document.getElementById('fn_stat').innerHTML = fnSet.size
        //document.getElementById('precision_stat').innerHTML = precision
        //document.getElementById('recall_stat').innerHTML = recall
        //document.getElementById('f1_stat').innerHTML = f1Score
        
        f1Dataset.push({
            x: j,
            y: f1Score
        })
        tpDataset.push({
            x: j,
            y: tpSet.size
        })
        F1Array.push(f1Score)
        labels.push(j)
    }

    var ctx = document.getElementById('plotF1Report_2').getContext('2d');
    var chart = new Chart(ctx, {
          // The type of chart we want to create
          type: 'line',

          // The data for our dataset
          data: {
                labels: labels,
                fill: false,
                datasets: [
                {
                    label: `F1 Score`,
                    // backgroundColor: 'rgb(255, 99, 132)',
                    borderColor: 'rgb(255, 99, 132)',
                    data: f1Dataset,
                },
                
                ]
          },

          // Configuration options go here
          options: {
            aspectRatio: 1.0,
            scales: {
                xAxes: [{
                  scaleLabel:
                  {
                    labelString: 'Timestep',
                  display: true,
                  }
                  
                }],
            }
          }
      }); 
      var ctx = document.getElementById('plotCommonNodes').getContext('2d');
    var chart = new Chart(ctx, {
          // The type of chart we want to create
          type: 'line',

          // The data for our dataset
          data: {
                labels: labels,
                fill: false,
                datasets: [
                    {
                        label: `# of nodes at iteration `,
                        // backgroundColor: 'rgb(255, 99, 132)',
                        borderColor: 'rgb(60, 40, 250)',
                        data: tpDataset,
                    }
                ]
          },

          // Configuration options go here
          options: {
            title: {
                display: true,
                text: 'Common Infected Nodes at each iteration'
            }
          }
      }); 
    //plotCommonNodes
}