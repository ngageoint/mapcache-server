angular
  .module('mapcache')
  .directive('stylePreview', stylePreview);

function stylePreview() {
  var directive = {
    restrict: "A",
    template: '<canvas height="30" width="32"></canvas>',
    replace: true,
    scope: {
      stylePreview: '='
    },
    controller: StylePreviewController
  };

  return directive;
}

StylePreviewController.$inject = ['$scope', '$element'];

function StylePreviewController($scope, $element) {

  function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
  }

  $scope.$watch('stylePreview', function() {
    if (!$scope.stylePreview) return;
    var canvas = $element[0];

    if (canvas.getContext){
      var ctx = canvas.getContext('2d');
      ctx.clearRect ( 0 , 0 , canvas.width, canvas.height );
      var rgbFill = hexToRgb($scope.stylePreview.fill);
      ctx.fillStyle = "rgba("+rgbFill.r+","+rgbFill.g+","+rgbFill.b+","+$scope.stylePreview['fill-opacity']+")";
      ctx.lineWidth = $scope.stylePreview['stroke-width'];
      var rgbStroke = hexToRgb($scope.stylePreview['stroke']);
      ctx.strokeStyle = "rgba("+rgbStroke.r+","+rgbStroke.g+","+rgbStroke.b+","+$scope.stylePreview['stroke-opacity']+")";

      ctx.beginPath();
      ctx.moveTo(10,0);
      ctx.lineTo(30,10);
      ctx.lineTo(32,20);
      ctx.lineTo(15,30);
      ctx.lineTo(18,18);
      ctx.lineTo(0,12);
      ctx.lineTo(10,0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

    } else {
      console.log('no canvas support');
    }
  }, true);
}
