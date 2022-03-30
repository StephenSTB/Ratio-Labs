const AFRAME = window.AFRAME;

AFRAME.registerComponent("mover", {
    init: function(){
        let el = this.el;
        this.animateMove =  function(){
            let currPosition = el.getAttribute('position');
            //console.log(currPosition.x)
            //console.log(to)
            var params = {
                property: 'position',
                to : {
                    x: currPosition.x -5,
                    y: currPosition.y,
                    z: currPosition.z
                },
                dur: 5000,
                easing: 'easeInOutElastic'
            }
            console.log(params)
            
            el.setAttribute('animation', params);
        }
        
        this.returnMove = function(e){
            let p = e.detail.returnPoint;
            console.log(p)
            let params = {
                property: 'position',
                to: {
                    x: p.x,
                    y: p.y + 2,
                    z: p.z
                },
                dur: 5000,
                easing: 'easeInOutQuad'
            }
            
            el.setAttribute('animation', params);   
        }

        this.el.addEventListener('click', this.animateMove);
        this.el.sceneEl.addEventListener('returnSphere', this.returnMove)
    
    },
    remove: function(){
        this.el.removeEventListener('click', this.animateMove);
        this.el.sceneEl.addEventListener('returnSphere', this.returnMove)
    }
})