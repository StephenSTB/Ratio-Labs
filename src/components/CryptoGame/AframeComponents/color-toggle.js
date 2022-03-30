const AFRAME = window.AFRAME;

AFRAME.registerComponent('color-toggle', {
    init: function(){
        let el = this.el;
        var index = 0;
        var colors = ["red", "green", "orange"]
        this.toggleColor = function(){
            index = (index + 1) % colors.length ;
            el.setAttribute("color", colors[index])
        }
        this.el.addEventListener('click', this.toggleColor)
    },
    remove: function(){
        this.el.removeEventListener('click', this.toggleColor)
    }
})