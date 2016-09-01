var gulp = require('gulp');
var webserver = require('gulp-webserver');
var $ = require('gulp-load-plugins')();

gulp.task('styles', function () {
  return gulp.src('app/styles/**/*.{scss,css}')
    .pipe($.plumber())//其它任务失败时，抛出错误，不影响其它任务执行
    .pipe($.cssSpritesmith({
      imagepath:'app/styles',
      spritedest:'images/icon',
      spritepath:'images/icon',
      padding: 10
    }))
    .pipe($.concat('all.css'))
    .pipe($.sass({
      style: 'expanded',  //css编译出来的模式，共四种 nested  compact  compressed
      precision: 10   //指定非整数保留几位小数点
    }))
    .pipe($.autoprefixer({browsers: ['last 1 version']})) //自动添加厂商前缀
    .pipe($.cssnano())
    .pipe(gulp.dest('dist')) //产出到dist目录下

});

gulp.task('scripts', function () {
  return gulp.src('app/scripts/**/*.js')
    .pipe($.plumber())
    .pipe($.uglify())
    .pipe($.concat('all.js'))
    .pipe($.sourcemaps.init())
    // .pipe($.babel())//用Es6书写方式
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));
});

gulp.task('images', function () {
  return gulp.src('app/images/**/*')
    .pipe($.cache($.imagemin({ //cache避免对已经压缩过的再次压缩失真   imagemin：图片压缩
      progressive: true,//图像渐进式扫描，对jpg图片，图像先模糊变清晰
      interlaced: true //.gif图像隔行显示
    })))
    .pipe(gulp.dest('dist/images'))
});

gulp.task('html', ['styles', 'scripts'], function () {
  return gulp.src('app/*.html')
    .pipe($.useref({searchPath: ['.tmp', 'app', '.']}))//通过解析html中的注释块，来处理html中未进行合并的css，js资源引入
    .pipe($.if('*.js', $.uglify()))  //符合条什的流，js压缩
    .pipe($.if('*.css', $.cssnano())) //压缩css
    .pipe($.if('*.html', $.minifyHtml({
      conditionals: true,
      loose: true//压缩空格至少保一个空格
    })))
    .pipe(gulp.dest('dist'));

});

gulp.task('jshint', function () {
  var jshint = require('gulp-jshint');
  return gulp.src('app/scripts/**/*.js')
    .pipe($.jshint())
    .pipe($.jshint.reporter('default'));//校检未能过时， 启动失败
});

gulp.task('fonts', function () {
  return gulp.src('app/fonts/**/*.*')
    .pipe($.filter('**!/!*.{eot,svg,ttf,wof}'))//过滤指定文件
    .pipe($.flatten())//将长长的相对路径移除
    .pipe(gulp.dest('dist/fonts'));
});

gulp.task('extras', function () {
  return gulp.src(
    [
      'app/!*.*',
      '!app/!*.html'
    ],
    {
      dot: true  //文件路径匹配时，同样匹配点开头的文件
    })
    .pipe(gulp.dest('dist'))
});

gulp.task('clean', require('del').bind(null, ['.tmp', 'dist']));

gulp.task('watch', function () {
  $.livereload.listen();

  gulp.watch([
    'app/*.html',
    'app/styles/**/*.{css,scss}',
    'app/scripts/**/*.js',
    'app/images/**/*'
  ]).on('change', $.livereload.changed);

  // gulp.watch('app/styles/**/*.scss', ['styles']);
});

gulp.task('server', function () {
  gulp.src('app')
    .pipe(webserver({
      host: '192.168.22.169',
      port: 6030,
      path: '/',
      open: true,
      fallback: 'index.html'
    }))
});

gulp.task('default', ['server', 'watch']);

gulp.task('dist', ['server', 'clean', 'jshint', 'html', 'images', 'fonts', 'extras'])



