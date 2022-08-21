const modelDescriptors2 ={
    SI:{
      state_labels:{
        0:"Susceptible",
        1:"Infected"
      },
      nodeColor: chroma.scale(['#fafa6e','#2A4858'])
      .mode('lch').colors(6)
      // .range(colorbrewer['RdYlBu'][3])
    },
    SIR:{
      state_labels:{
            0:"Susceptible",
            1:"Infected",
            2:"Recovered"
      },
      nodeColor: chroma.scale(['#fafa6e','#2A4858'])
      .mode('lch').colors(6)
      // .range(colorbrewer['RdYlBu'][3])
    },
    SIS:{
      state_labels:{
        0:"Susceptible",
        1:"Infected"
      },
      nodeColor: chroma.scale(['#fafa6e','#2A4858'])
      .mode('lch').colors(6)
      // .range(colorbrewer['RdYlBu'][3])
    },
    SEIR:{
      state_labels:{
        0:"Susceptible",
        1:"Exposed",
        2:"Infected",
        3:"Recovered"
      },
      nodeColor: chroma.scale(['#fafa6e','#2A4858'])
      .mode('lch').colors(6)
      // .range(colorbrewer['RdYlBu'][3])
    },
    SEIS:{
      state_labels:{
        0:"Susceptible",
        1:"Exposed",
        2:"Infected"
      },
      nodeColor: chroma.scale(['#fafa6e','#2A4858'])
      .mode('lch').colors(6)
      // .range(colorbrewer['RdYlBu'][3])
    },
    Threshold:{
      state_labels:{
        0:"Susceptible",
        1:"Exposed",
        2:"Infected"
      },
      nodeColor: chroma.scale(['#fafa6e','#2A4858'])
      .mode('lch').colors(6)
      // .range(colorbrewer['RdYlBu'][3])
    },
  
  }