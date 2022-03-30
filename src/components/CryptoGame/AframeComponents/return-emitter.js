const AFRAME = window.AFRAME;

AFRAME.registerComponent('return-emitter', {
    init: function(){
        let el = this.el;
        this.returnCall = function(){
            let p = el.getAttribute('position');
            el.emit('returnSphere', {returnPoint: p})
        }
        el.addEventListener('click', this.returnCall)
    },
    remove: function(){
        this.el.removeEventListener('click',this.returnCall)
    }
})