# [gulp][gulp]-svg-inject

> Inline svg files and urls inside html or js files.
This gulp plugin parses html or js files and replaces \<img\> tags that point to local or remote svg files with the content of the svg files.<br>
Inlining svg file is useful for applying (dynamic) css styling to svg elements.


## Install

Install `gulp-svg-inject` as a development dependency:

```shell
npm install --save-dev gulp-svg-inject
```


## Usage


```html
<div>
  <img src="/src/img/icon.svg" class="icon">
  <img src="https://upload.wikimedia.org/wikipedia/commons/b/b9/FP_Mushroom_icon.svg" class="mushroom" />
</div>
```

```javascript
var gulp = require('gulp');
var svgInject = require('gulp-svg-inject');
var	svgMin = require('gulp-svgmin');

gulp.task('default', function () {
	return gulp.src(['/src/**/*.html','/src/**/*.js'])
		.pipe(svgInject())
		.pipe(gulp.dest('/public/'));
});
```

will replace the <img> tags with the content of the svg files

```html
<div class="icon">
  <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><ellipse class="st0" cx="16" cy="22.9" rx="2.3" ry="2.3"></ellipse><path d="M18.6 9.8l-1.1 7.7c0 .4-.2.8-.6 1-.3.2-.6.3-.9.3h-.2c-.7-.1-1.2-.7-1.3-1.4l-1.1-7.6c-.2-1.5.8-2.8 2.3-3 1.4-.2 2.7.9 2.9 2.3v.7z"></path></svg>
  <svg class="mushroom" xmlns="http://www.w3.org/2000/svg" width="400" height="440"><path d="m 315.56 828.85 c 19.01 -1.958 41.1 -2.543 54.718 -17.932 16.372 -19.439 15.16 -48.09 5.906 -70.44 -14.717 -37.35 -46.17 -65.24 -80.56 -84.58 -30.619 -16.636 -65.32 -25.519 -100.26 -25.03 l -0.005 -0.013 c -61.09 1.682 -121.05 32.842 -156.79 82.34 -16.28 23 -26.908 52.878 -18.586 80.82 4.489 14.02 15.507 25.343 29.954 28.765 85.28 10.849 180.46 14.597 265.62 6.07 z m -178.09 40.787 c -12.23 40.35 -22.05 68.24 -20.405 110.65 1.344 17.195 6.122 37.681 23.07 45.857 20.05 9.973 43.47 7.04 65.22 7.744 20.405 -0.223 41.597 0.595 61.01 -6.223 16.247 -8.05 24.924 -26.51 24.726 -44.11 3.961 -42.491 -8.113 -72.16 -19.942 -112.46 z" transform="translate(0 -612.36)" stroke="#000" stroke-width="16"/></svg>
</div>
```


## License

MIT © [Bateast2](https://github.com/bateast2)

[gulp]:    https://github.com/bateast2/gulp
[npm]:     http://badge.fury.io/js/gulp-svgmin
