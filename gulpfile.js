/// <binding ProjectOpened='build' />
'use strict';

// Gulp utilities
const { src, dest, series, parallel, watch } = require('gulp');

// Styles
const sourcemaps = require('gulp-sourcemaps');
const sass = require('gulp-dart-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cleanCss = require('gulp-clean-css');

// Scripts
const minify = require('gulp-minify');
const include = require('gulp-include');

// Markup
const beautifyCode = require('gulp-beautify-code');
const twig = require('gulp-twig');
// const hashSrc = require('gulp-hash-src');

// Live server
const connect = require('gulp-connect');
const open = require('gulp-open');


// Sass processing
// Also includes some compatibility functions and source maps.
function styles() {
    return src([
        'src/assets/scss/multilevel-nav.scss',
        'src/assets/scss/demo.scss'
    ])
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss([
            autoprefixer({ grid: true })
        ]))
        .pipe(cleanCss())
        .pipe(sourcemaps.write('./'))
        .pipe(dest('dist/assets/css'))
        .pipe(connect.reload());
}

// Javascript processing
// Minifies all *.js files that don't start with an underscore.
function scripts() {
    return src([
            'src/assets/js/**/*.js',
            'src/assets/off-canvas/assets/js/**/*.js'
        ], { sourcemaps: true })
        .pipe(include({
            includePaths: [ 
                __dirname + '/node_modules', 
                __dirname + '/src/assets/js' 
            ]
        }))
        .pipe(minify({ ext: { min: ".min.js" }}))
        .pipe(dest('dist/assets/js', { sourcemaps: '.' }))
        .pipe(connect.reload());
}

// Copy off canvas
// function offCanvas() {
//     return src('src/assets/off-canvas/**/*')
//         .pipe(dest('dist/assets/off-canvas/'))
//         .pipe(connect.reload());
// }

// Convert gulp to HTML markup
// Formats code nicely
// Inserts cache busting query string parameters for linked assets (CSS, JS, Images)
function markup() {
    return src([
            'src/**/*.twig',
            '!src/**/_*'
        ])
        .pipe(twig())
        .pipe(beautifyCode())
        .pipe(dest('dist/'))
        .pipe(connect.reload());
}

// Watch all files and rebuilds as necessary, copying files to the CMS project.
// Launches a live server with live reload.
function server(cb) {
    watch('src/assets/scss/**/*.scss', series(styles, scripts));
    watch('src/assets/js/**/*.js', series(scripts, styles));
    // watch('src/assets/off-canvas/**/*', series(offCanvas));
    watch('src/**/*.twig', series(markup));

    connect.server({
        root: 'dist/',
        livereload: true
    });

    setTimeout(function () {
        open({ uri: 'http://127.0.0.1:8080/' });
        cb();
    }, 2000);
}

const build = series(parallel(styles, scripts), markup);

// Export the public tasks

// Builds all the files and quits.
exports.build = build;

// Builds files and then launches the server
exports.server = series(build, server);

// Make the server task the default one.
exports.default = exports.server;
