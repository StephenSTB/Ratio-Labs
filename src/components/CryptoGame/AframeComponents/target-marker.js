const AFRAME = window.AFRAME;

AFRAME.registerComponent(`target-marker`, {
    init: function(){
        let el = this.el;
        this.addMarker = function(e){
            let p = e.detail.intersection.point;
            //let scene = document.querySelector('a-scene');

            let newMark = document.createElement('a-entity');

            newMark.setAttribute('geometry', {primitive: 'sphere'});

            newMark.setAttribute('material', 'color: blue');

            newMark.setAttribute('scale', '.2 .2 .2');

            newMark.setAttribute('position', el.object3D.worldToLocal(p))
            
            el.appendChild(newMark);

        }
        this.el.addEventListener('click', this.addMarker)
    },
    remove: function(){
        this.el.removeEventListener('click', this.addMarker)
    }
})