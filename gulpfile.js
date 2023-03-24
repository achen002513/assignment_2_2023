const { watch, series, src, dest } = require("gulp");
const browserSync = require("browser-sync").create();
const postcss = require("gulp-postcss");
const sharpResponsive = require("gulp-sharp-responsive");
var clean = require("gulp-clean");
var fs = require("fs");

// Task for compiling our CSS files using PostCSS
function cssTask(cb) {
    return src("./assets/styles/*.css") // read .css files from ./src/ folder
        .pipe(postcss()) // compile using postcss
        .pipe(dest("./dist/styles")) // paste them in ./assets/css folder
        .pipe(browserSync.stream());
    cb();
}

// Task for starting the browser-sync
function browsersyncServeInitTask(cb) {
    browserSync.init({
        server: {
            baseDir: "./dist",
        },
    });
    cb();
}

// Task for browser-sync to initiate a reload
function browsersyncReloadTask(cb) {
    browserSync.reload();
    cb();
}

// Task for copying all HTML files to the dist/ folder
function copyHtmlTask(cb) {
    return src("./src/**/*.html")
           .pipe(dest("./dist"));
    cb();
}

// Task for resizing images for responsive display
function imagesTask(cb) {
    return src("./assets/images/**/*.{jpg,jpeg,png}")
        .pipe(sharpResponsive({
            formats: [
                { width: 640, rename: { suffix: "-sm" }, format:"webp" },
                { width: 1024, rename: { suffix: "-lg" }, format:"webp" },
            ],
            includeOriginalFile: true,
        }))
        .pipe(dest("./dist/images"));
    cb();
}

// Task for deleting the ./dist folder for clean build
function cleanDistTask(cb) {
    const distributionDirectory = "./dist"
    if (!fs.existsSync(distributionDirectory)){
        fs.mkdirSync(distributionDirectory);
    }
    return src(distributionDirectory, {read: false})
        .pipe(clean());
    cb();
}

// Watch Files & Reload browser after tasks
function watchTask() {
    watch(["./assets/images/**/*.{jpg,png,jpeg}"], series(imagesTask, browsersyncReloadTask));
    watch(["./src/**/*.html"], series(cssTask, copyHtmlTask, browsersyncReloadTask));
    // Tailwind CSS looks into HTML and dynamic include CSS classes that are used to the main.css
    watch(["./assets/styles/**/*.css"], series(cssTask, browsersyncReloadTask));
}

// Default Gulp Task
exports.default = series(cleanDistTask, copyHtmlTask, cssTask, imagesTask, browsersyncServeInitTask, watchTask);
exports.build = series(cleanDistTask, copyHtmlTask, cssTask, imagesTask);
