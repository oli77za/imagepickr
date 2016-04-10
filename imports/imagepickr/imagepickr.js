import { Template } from 'meteor/templating';

import './imagepickr.html';

Template.imagepickr.onCreated(function() {
    this.loadedImage = new ReactiveVar();
    this.zoom = new ReactiveVar(0.2);
    this.pan = new ReactiveVar([0,0]);
});

Template.imagepickr.onRendered(function() {
    this.autorun(() => {
        var imageFile = this.loadedImage.get();
        if (imageFile) {
            var canvas = this.find('canvas');
            var ctx = canvas.getContext('2d');
            var url = "data:image/jpeg;base64," +_arrayBufferToBase64(imageFile);
            var img = new Image();
            img.src = url;
            var zoom = this.zoom.get();
            var pan = this.pan.get();
            ctx.clearRect(0,0,canvas.width, canvas.height);
            ctx.save();
            ctx.translate(pan[0],pan[1]);
            ctx.scale(zoom,zoom);
            ctx.drawImage(
                img,
                0,
                0
            );
            ctx.restore();
        }
    });
});

Template.imagepickr.helpers({
    loadedImage() {
        return this.loadedImage.get();
    },
    getZoom() {
        return Template.instance().zoom.get();
    }
});

Template.imagepickr.events({
    'change input[type="file"]': function (event, template) {
        var file = event.currentTarget.files[0];
        if (!file.type.match('image.*')) {
            return;
        }
        var fileReader = new FileReader();
        fileReader.onload = function(readerEvent) {
            data = new Uint8Array(readerEvent.target.result);
            template.pan.set([0,0]);
            template.loadedImage.set(data);
        };
        fileReader.readAsArrayBuffer(file);
    },
    'keyup input[name="zoom"],change input[name="zoom"]': function (event, template) {
        template.zoom.set(parseFloat(event.target.value));
    },
    'mousedown .control_overlay': function(event, template) {
        console.log("pan_started", event);
        template.startX = event.offsetX;
        template.startY = event.offsetY;
        template._pan = template.pan.get();
        $('.control_overlay').on('mousemove', {template: template}, panHandler);
        $('body').on('mouseup', function(e) {
            console.log("Setting pan to " , template._pan);
            template.pan.set(template._pan);
            $('.control_overlay').off('mousemove', panHandler);
        });
    }
});

function panHandler(e) {
    e.data.template._pan = [
        e.offsetX - e.data.template.startX,
        e.offsetY - e.data.template.startY
    ];
}

function _arrayBufferToBase64( bytes ) {
    var binary = '';
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    return window.btoa( binary );
}

