(function() {
'use strict';
 
// Feature detect
if (!(window.customElements && document.body.attachShadow)) {
  document.querySelector('tl-etherlynk').innerHTML = "<b>Your browser doesn't support Shadow DOM and Custom Elements v1.</b>";
  return;
}

 
customElements.define('tl-etherlynk', class extends HTMLElement {

  constructor() {
    super(); // always call super() first in the ctor.


    // Create shadow DOM for the component.
    let shadowRoot = this.attachShadow({mode: 'open'});
  
  
    //The following array is like this ... [midinumber,color,buttontitle]

    this.buttonmap=[
                      [null],
                      [56,null],[57,null],[58,null],[59,null],[60,null],[61,null],[62,null],[63,null],   [82,null],
                      [48,null],[49,null],[50,null],[51,null],[52,null],[53,null],[54,null],[55,null],   [83,null],
                      [40,null],[41,null],[42,null],[43,null],[44,null],[45,null],[46,null],[47,null],   [84,null],
                      [32,null],[33,null],[34,null],[35,null],[36,null],[37,null],[38,null],[39,null],   [85,null],
                      [24,null],[25,null],[26,null],[27,null],[28,null],[29,null],[30,null],[31,null],   [86,null],
                      [16,null],[17,null],[18,null],[19,null],[20,null],[21,null],[22,null],[23,null],   [87,null],
                      [8,null] ,[9,null] ,[10,null],[11,null],[12,null],[13,null],[14,null],[15,null],   [88,null],
                      [0,null] ,[1,null] ,[2,null] ,[3,null] ,[4,null] ,[5,null] ,[6,null] ,[7,null] ,   [89,null],

                      [64,null],[65,null],[66,null],[67,null],[68,null],[69,null],[70,null],[71,null],   [98,null]
    ]

    
    this.slidermap = {48:0,49:1,50:2,51:3,52:4,53:5,54:6,55:7,56:8}
    this.timeout={}
    this.timeoutval = 500;
    this.midienabled = false;


    this.defaultbuttonmap = this.buttonmap.slice(0);

    this.buttonSlot;
  
    shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 780px;
          height:580px;
          overflow:hidden;
          font-family: 'helvetica';
          contain: content;
          background-color: #656565;
          padding:10px;
          border-radius:10px;
          background-image:url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEUAAAA6CAYAAADm+ZQ9AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYxIDY0LjE0MDk0OSwgMjAxMC8xMi8wNy0xMDo1NzowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNS4xIFdpbmRvd3MiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6QTQ4MzIyQTk3NDk0MTFFNDk3RDlGNUIxMkU3NDc0MkEiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6QTQ4MzIyQUE3NDk0MTFFNDk3RDlGNUIxMkU3NDc0MkEiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpBNDgzMjJBNzc0OTQxMUU0OTdEOUY1QjEyRTc0NzQyQSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpBNDgzMjJBODc0OTQxMUU0OTdEOUY1QjEyRTc0NzQyQSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PjqnXlUAAAlGSURBVHja7FtraFxFFL5nkjYoaWzatKlJa3y0iWlYjTG1rdbaWlQQQUUU/aGCvwQV/CnoLxVBEBTfoCiCfwQF/SH4oDYWQ1r7TEObNj5CiNnGxJqaVsE2e48z9zF3Zu7Mnbm7i8TaC+3O7t3M3PnmnO9858wsIKJ3/pIvch6C86A4XbWVdjA3+N6dpdEv78n+Fggv4CefgtMY6CkujkjEu9W4ai677ZPaqx/5LHiuSjhlbs8rD5/9/uUXaLPFCAbIr5ACSWqk4JCbMTzI3/PXyq/iBY+NtVZsKaWJgW16QEQwBCBAc9/FwvikWV8MCPb3DKDwNbhdIThQ1zBTFfeBhQ2zDGEJGAADGAYgwOo7CqDCn0YYYDBm/KY8YKBp7f6qgLLw9nce9yd2vaifJLgZgQclCyo1LtTh/3ak52z/s6/R5qpyrKamdeP2qhEtad0wPi/CaMv68bn+517jVpMPmGLVLGU+XX5x9yrqsj5ElCOSs1v0uXXo3APl+PdbPCBtDIS8wMCilT9XVafMlwtPDHcnRO/lAoY0rR08J0EJLSWae05gSOvGr885me+Pbe/Cs6caAjBAkAaiCjAHwyIRSLZsS6Hhr36u//nXw8FYSI0VKpXwsXJlbfaGiqIF2159yioEB9++z5/cuzlaVqIVLBiFaJQ/84/v3kLHWp1MHDMsBq0RtCxQznzx6OfeqYnN4WpEyxG3Q0BCQRW+H/Yn97xKVqwrGvlg5tiFpUNvP0O/WxAVLGIKkKTNbyIXisFHEjCQFsXKG9VKyueUU79cloAg2mcISKxo4yfKAiSwvPG+O2jkKKjKDmIJL04jkvgJaiClUlpg4nuAKYColeyoGJTS6NeF0E2EJwERBBkQ6j4nrZFjZqSQAJxKdyKwUTYYEFBADTBiRyAAqgxAmrr2VgwKnjjSQ0dp4yskkBtwd+IfeGTplQetfZ4c6ZLzIoyXVgEoTAhRBU02DwFMlMDQWIukZMsGhSrHrXJ+I7iNyPIRONR1dlpB+fN4mxwIQV7hmCkFb9ECExMrAw41IEvWElvK2tPVAIUpRxkT1W2Sz4egeV1fZn+/fNtO+/NT3sMefkH99pqO+99Saio1IvnOHfnwCe/M7KYk4ggT11oLhk36H2ldv73iyhtVjfVKFS2yEk8uCwjgkBW9k5mdnhwpUCvrVd2HtnbXbn7pAVjeM20tdh18c1MwpkC8RmvhgKGUGZcNCkvPacdtnq5opAOrvnXM2uf0geslYuZ9U2AcAKHh/OoUyyqTl+syMVvDuI5PyrGUbt3kZcWY3CdLOg7ZSfaHLskd40Vd3tPvtFC/7kusBFSeUfgJk+odKplx2TI/4BNPdhUAbXE6HLy5d6cFkDrv7J8NwdeJEN5pGxa3H3J6KCrvAQzjGwte9F7DylFjgpjPfYZ70oPoXCeY2xC1lEGrlRBvY+I+MTLkOxdLoaKvXWu5nspx6WI5jTpGqVCbw0pWpbAwlSDDhyhRS8kkWfzjh4IUuRL38UnLjT9aXW9qH8uVug1aPh3eBdciBj7JZSmhaItJ1laHpea5pGPIiU88kBUx45eFi2adnmnmWCG1KGCrFwftMdKy4ZuKQfEnIj4xWoncJs3Xfmed1PSBjYn+YxxAAhoky64ZcCbZFLdlLBjINd3KQREjT3ZxL/y/0cIn0weWiZwEQh4Fi9fYo9bMSF2GoSZNzXfIUrPr5HMflhk7FYGD7wzZ3IfmO1fRl01xOSCpDGAfNHUPOIBSoN/vMT+CsXziQVNnZj7mRLRBZqwOCpq2OHBjx192PpFqAiE0zFKauk9YLXeKF6QMk0cjWFkk62wpAcmiSrKagTEHn0xRPuFFo+gfk/cNVwy7kWxgaWqxRX4k1D0nUpJd31cxKKWJXVvTfZsHp/mOQ2ZcbJOraayuSEG56IqjuSKPJ/SR5UvCbVjaebpyS2E5TyYi4sB42EqyU/uXBccpAiBi2/dDS7nIgWSn9q1Ibaqj9llSbXKxPjPOD8rfs4tN5oGYXhFyyc3DdtGF67nbcExwABzCMQ3FN9CXnthdEHUWYdjOaOoctPVvJdrS0Y/ZBGqQny1BTQaaKFmobxlzmNQmnsCJtVb20eI1f1sX6fdj3TEHCaikuAXVYrfnjVI+2VExKP5vh3u94KgFpos3vDYqnB9ptCtZn/FBZCEgVNdg+bUDufgkNXGNK0l0g4RcestQFUA50p3MWUgeMHnPqmQQ3XepyXpnZhs9bnfIxRvlk8NOoJxmJM2KSAYr4QUmmWdg4aIZl/7toEzs2uYJ9TAQxYkKFnojYKnJBpktekqSxiYBe2lmbA3l/viOThkQMaR7wp6QainISLavYlAoIKtS4U06WYSScgzyFsseD/5KRRdij5S2RttDZOVNIy6uQwExcErYTvbJ5GgEFtHmFH2C8mN8dAuFfRd1p44/E32gE0cvNPY3uXdF6afPHkytMIs8tfVOmXGwtaoDxEP5H6pn4eyizc1SQpI1CyEAWQ+A137m07sPRKUAZY+Zt7v4gT4h1SeNbnziLaj/g2kh+q8rWRAUrEQBJ7w9RpZ2HszKjPO4zxZl3yHcJOA7l3H4kNyoXS5jQLKaoJcTEEaenU6YbH3laX9yzxtpv1J1ibgRn10qyAUKzYwvNw4u7UDK/MAlCAp1V/Gh+TGACGSkWXVz707Xh7bxVqVXrTvJKkpWidBaYFLVdVCSEN4Tse4P/YuXGZTirps900nqaNXZcQvJjWR+0RqVBE58f5FdBc8PUKYPr7PXkjDiFwiTF1ZfVY9RQRiVwHiomIbx5t7+/wYoRYVkdagIqU8CDGjdhMtxjI9VJFoHljio4PkACs2MG51KjxIwOv4QSnMgel8MEFXBSzrmPyil0a8K7l0YgBF1TMC6KHwBRIAIufi64rwHxZ8YuMVIsg7AJMdBMNnPkbhGBmhu4IXHvDrNXk9WnVzSJdHBQc2x0Np1T35QHVBYZpz7kuujfM48doN8GoCfJ8HVc0Pvvy6zL1rAEWQ83wlQZX9wFdnPb+ru+uihKlhKkhnnxyaxBhSObKYu8ORMO9M0lDpJ6gdRxh8otFSVaCu7hGRM+rGSkPPISZQt9itAWMHgllJ75b3vVgUUam4bIvFW5Qsy5p/8tlDiCYM+chqtae1+0xmUzL87/7vknPWU/+v1jwADANbcmhnGlvSpAAAAAElFTkSuQmCC");
          background-repeat: no-repeat;
          background-position: 762px 567px; 
          background-size: 33px 27px;
        }
        .but{
          height:40px;
          width:75px;
          float:left;
          border-radius:5px;
          overflow: hidden;
          margin:4px;
          position:relative;
          font-family: 'helvetica';
          // font-weight:bold;
          font-size: 14px;
          box-sizing: border-box;
        }
        .round{
          position:relative;
          height:40px;
          width:40px;
          border-radius:50%;
          margin-left:15px;
          margin-right:40px;
          overflow: visible;          
        }

        .round label{
          display:block;
          position:absolute;
          top:9px;
          left:40px;
          // white-space: nowrap;
          width:70px;
          text-align:left;
          color:#fff;
        }
        
        .bot{
          margin:15px 18px 14px 25px;
        }

        .bot label{
          display:block;
          position:absolute;
          top:40px;
          left:-13px;
          text-align:center;
          white-space: normal;
          color:#fff;
        }

        .square{
          border-radius:5px;
          margin: 15px 0 0 16px;
        }
        
        .red{
          background-color:red;
          color:#fff;
        }
        .green{
          background-color:green;
          color:#fff;
        }
        .yellow{
          background-color:yellow;
          // color:#fff;
        }

        .greenflash{
          background-color: green;
          color: #fff;
          animation: backgroundblinker .5s step-end infinite alternate;
          -webkit-animation: backgroundblinker .5s step-end infinite alternate;
        }

        .redflash{
          background-color: red;
          color: black;
          animation: backgroundblinker .5s step-end infinite alternate;
          -webkit-animation: backgroundblinker .5s step-end infinite alternate;
        }

        .yellowflash{
          background-color: yellow;
          color: black;
          animation: backgroundblinker .5s step-end infinite alternate;
          -webkit-animation: backgroundblinker .5s step-end infinite alternate;
        }


        @-webkit-keyframes backgroundblinker { 
           // 50% { background-color: transparent; } 
           50% { background-color: #DDD; color:black;} 

        }
        @keyframes backgroundblinker { 
           // 50% { background-color: transparent; } 
           50% { background-color: #DDD; color:black;} 

        }
        
        #sliders{
          // border:solid red 1px;
          width:800px;
          margin-top:475px;
          margin-left:10px;
        }


        input[type=range].vertical
        {
            writing-mode: bt-lr; /* IE */
            -webkit-appearance: slider-vertical; /* WebKit */
            width: 72px;
            height: 100px;
            padding: 0px;
            margin:0 6px 0 0;
        }


      </style>
      <div id="buttonSlot"></div>
      <div id="sliders">
        <label for="slider1"></label><input id="slider1" mid="48" type="range" min="0" max="128" value="64" class="vertical">
        <label for="slider2"></label><input id="slider2" mid="49" type="range" min="0" max="128" value="64" class="vertical">
        <label for="slider3"></label><input id="slider3" mid="50" type="range" min="0" max="128" value="64" class="vertical">
        <label for="slider4"></label><input id="slider4" mid="51" type="range" min="0" max="128" value="64" class="vertical">
        <label for="slider5"></label><input id="slider5" mid="52" type="range" min="0" max="128" value="64" class="vertical">
        <label for="slider6"></label><input id="slider6" mid="53" type="range" min="0" max="128" value="64" class="vertical">
        <label for="slider7"></label><input id="slider7" mid="54" type="range" min="0" max="128" value="64" class="vertical">
        <label for="slider8"></label><input id="slider8" mid="55" type="range" min="0" max="128" value="64" class="vertical">
        <label for="slider9"></label><input id="slider8" mid="56" type="range" min="0" max="128" value="64" class="vertical">
      </div>
    `;
  }
  
  
  set data(data){
    this.buttonmap=data
    this._updateshaddowdom()
  }

  get data(){
    return this.buttonmap;
  }

  
  setbutton(data){
    var index = this.buttonmap.findIndex(x => x[0]==data[0]);
    this.buttonmap[index]=data
    this._updateshaddowdom()
  }


  connectedCallback() {  
    
      if(this.midienabled==true){
        Tletherlynk.Midi.init()
      }

      this.buttonSlot = this.shadowRoot.querySelector('#buttonSlot');
      this.sliders = this.shadowRoot.querySelector('#sliders').getElementsByTagName("input")
      this.test = this.getAttribute('name');


      this.buttonSlot.addEventListener("mousedown", this._onclickbuttondown.bind(this), true);
      this.buttonSlot.addEventListener("mouseup", this._onclickbuttonup.bind(this), true);

      for (var i = 0; i < this.sliders.length; i++) {
        this.sliders[i].addEventListener("input", function(e){
          _this._broadcastevent(176,e.path[0].getAttribute("mid"),e.path[0].value)
        });

        this.sliders[i].addEventListener("wheel", function(e){

          console.log("wheel",e.deltaY)


          if(e.deltaY>0){
              this.value-=10;
          }else{
              this.value-=-10;
          }
          _this._broadcastevent(176,e.path[0].getAttribute("mid"),e.path[0].value)
        },{
          capture: true,
          passive: true
        });

      };

     
      var _this=this;



         document.body.addEventListener('webmidievent', function (e) {
              if(_this.midienabled==true){
          
                 // console.info('webmidievent recieved',e.detail)
                  _this._broadcastevent(e.detail.data1,e.detail.data2,e.detail.data3)

                  switch (e.detail.data1 & 0xf0) {
                    case 144:
                        //Note On 
                        if (e.detail.data2!=0) {  // if velocity != 0, this is a note-on message
                          // console.log("midi call back button= ",midiassignmentmap.pads[e.detail.data2])
                           return;
                        }
                    case 128:
                          //Note off
                          //console.log("note off = ",e.detail.data2)
                          return;

                    case 176:
                          //cc value
                          // console.log("midi knob= ",e.detail.data2)
                          
                          _this.sliders[_this.slidermap[e.detail.data2]].value=e.detail.data3;

                          return
                  }

              }
         }, false);


      setTimeout(function(){
        _this._updateshaddowdom()
      },100);  
  }


  _updateshaddowdom(){

     

      this.buttonSlot.innerHTML=""

          
      for (var i = 1; i < 82; i++) {      
              var contactbut = document.createElement('button');
              var label = document.createElement('label');

              if(i==81){
                 contactbut.className = "but round square"     
              }
              else if(i>72){
                 contactbut.className = "but round bot"     
                    if(this.buttonmap[i][1]=="redflash"){
                        colorcode="00";
                    }          
              }
              else{
                if(i % 9===0){
                    contactbut.className = "but round"   
                    
                }
                else{
                   contactbut.className = "but"
                }
              }

              if(this.buttonmap[i][2]!=undefined){
                contactbut.className = contactbut.className+" "+ this.buttonmap[i][1]
              }
           
              contactbut.id = "but"+i;
              if(this.buttonmap[i][2]!=undefined){
                label.innerHTML = this.buttonmap[i][2]
              }
              else{
                //show numbers
                // label.innerHTML = this.buttonmap[i][0]
              }
              
              label.setAttribute('uid', this.buttonmap[i][0]);

              contactbut.setAttribute('uid', this.buttonmap[i][0]);
              this.buttonSlot.appendChild(contactbut)
              contactbut.appendChild(label)


              //set midilights here
              if(this.buttonmap[i][1]!=undefined){

                var colorcode;
                switch(this.buttonmap[i][1]) {
                    case "red":
                        colorcode="03";  
                        break;
                    case "green":
                        colorcode="01";  
                        break;
                    case "yellow":
                        colorcode="05"; 
                        break;
                    case "redflash":
                        colorcode="04"; 
                        break;
                    case "greenflash":
                        colorcode="02"; 
                        break;
                    case "yellowflash":
                        colorcode="06"; 
                        break;
                    default:
                        //off
                        colorcode="00";
                }

                //overide for round red buts
                if(i>72){
                      if(this.buttonmap[i][1]=="redflash"){
                          colorcode="02";
                      }          
                }
                
                if(this.midienabled==true){
                  Tletherlynk.Midi.sendlight("144",this.buttonmap[i][0],colorcode)
                }
              }else{
                if(this.midienabled==true){
                  if(i==1){
                    console.log("1")
                    Tletherlynk.Midi.sendlight("144","56","00")

                  }
                  Tletherlynk.Midi.sendlight("144",this.buttonmap[i][0],"00")
                }
              }

      }

      // this.buttonSlot.addEventListener("mousedown", this._onclickbuttondown.bind(this), true);
      // this.buttonSlot.addEventListener("mouseup", this._onclickbuttonup.bind(this), true);

  }

  _onclickbuttondown(e){
      var userclicked = e.path[0].getAttribute("uid")
      console.info("Clicked > ",userclicked,e)
      this._broadcastevent(144,userclicked,127)
  }
  _onclickbuttonup(e){
      var userclicked = e.path[0].getAttribute("uid")
      console.info("Clicked > ",userclicked)
      this._broadcastevent(128,userclicked,127)
  }


  resetlights(){
      // reset midi lights
      for (var i = 1; i < 82; i++) {
        if(this.midienabled==true){
          Tletherlynk.Midi.sendlight("144",this.buttonmap[i][0],"00"); 
        } 
      }
  }

  loaddefaults(){
      this.buttonmap = this.defaultbuttonmap.slice(0)
      this._updateshaddowdom()
  }


  _broadcastevent(data1,data2,data3){

    var etherlynkuievent = new CustomEvent('etherlynk.ui.event', { 'detail': {'data1':parseInt(data1), 'data2':parseInt(data2), 'data3':parseInt(data3)} });
    document.body.dispatchEvent(etherlynkuievent);


    //test for key held
    if(parseInt(data1)==144){

      var etherlynkeventbuttondown = new CustomEvent('etherlynk.event.buttondown', { 'detail': {'button':parseInt(data2)} });
      document.body.dispatchEvent(etherlynkeventbuttondown);


      this.timeout[parseInt(data2)] = setTimeout(function(){
          // console.log("Button held",parseInt(data2))
          var etherlynkeventheld = new CustomEvent('etherlynk.event.held', { 'detail': {'button':parseInt(data2)} });
          document.body.dispatchEvent(etherlynkeventheld);
      
      }, this.timeoutval);
    }

    if(parseInt(data1)==128){
        clearTimeout(this.timeout[parseInt(data2)])
        delete this.timeout[parseInt(data2)]
        
        var etherlynkeventbuttonup = new CustomEvent('etherlynk.event.buttonup', { 'detail': {'button':parseInt(data2)} });
        document.body.dispatchEvent(etherlynkeventbuttonup);
    };

  }

  
});
   
})();