# Assignment 2

This code base is much closer to a real live project. It integrates with a few development tools to automate the image resizing, CSS post processing, and making Tailwind CSS framework locally.

## Automation

We have already experienced how [Browser Sync](https://browsersync.io/) reloads the page for us, and makes the page available to you mobile devices that connected to the same network. In fact more can be done through this automation.

### Task Runner

In order to automate a serial of tasks when certain file is updated we need a tool to cover this. [Gulp](https://gulpjs.com/) is a popular one back 4 years ago. The front end development field moves fast so it is no longer the favoriate but it serves a good choice for showing some basic concepts.

Below is a Gulp task definition that picks any JPEG or PNG files from the `assets` folder and resizes them to 640px and 1024px wide.

```javascript
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
```

### Image Resizing

As we making the layout responsive image size matters between different screen sizes. We don't want to load a large image with pixels exceeds the what is needed by the device. Resizing images is an intense task if done manually. [gulp-sharp-responsive](https://github.com/khalyomede/gulp-sharp-responsive) is a plugin for Gulp. It uses a Node.js module [Sharp](https://github.com/lovell/sharp) to handle common image format conversion and resizing.

The `imagesTask(cb)` definition 
Upon resizing it also renders the image to a new format - [WebP](https://developers.google.com/speed/webp#:~:text=WebP%20is%20a%20modern%20image,in%20size%20compared%20to%20PNGs.). WebP is a modern image format that provides superior lossless and lossy compression for images on the web.

### CSS Pre And Post Processing

Importing the entire Tailwind CSS framework is a bit overkill because not all the classes are used. It would be nice just include the portion of the framework that are utilized in the HTML or in the `main.css`.

```javascript
function cssTask(cb) {
    return src("./assets/styles/*.css") // read .css files from ./src/ folder
        .pipe(postcss()) // compile using postcss
        .pipe(dest("./dist/styles")) // paste them in ./assets/css folder
        .pipe(browserSync.stream());
    cb();
}
```

The above Gulp task definition pick all the CSS files found in the `assets/styles/` folder and compile the CSS file using the [PostCSS](https://postcss.org/) tool.

The configuration for PostCSS can be found in the `postcss.config.js`.

```javascript
module.exports = {
    plugins: {
        tailwindcss: {},
        autoprefixer: {},
        ...(process.env.NODE_ENV === 'production' ? { cssnano: {} } : {})
    },
};
```

This configuration tells the PostCSS to use TailwindCSS plugin to import CSS framework into the final CSS output. The TailwindCSS plugin has a configuration in `tailwind.config.js`.

```javascript
module.exports = {
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

The above configuration tells TailwindCSS plugin which files need to scan for search the usage of TailwindCSS classes. In this particular setting it says to scan all HTML and JS files in the `src` folder. For more details please check the [documentation](https://tailwindcss.com/docs/configuration#content). This is considered as the **Pre Processing**.

After Pre-Processing all the required CSS classes are collected. Now it's time to add any vendor specific prefixes. [Autoprefixer](https://github.com/postcss/autoprefixer) is a tool for adding prefixes such as `-moz-` for you autometically. This is considered as the **Post Processing**.

When comes to production deployment we need one more Post Process step that is to minify the CSS content. This is to remove the white spaces and comments. This step reduces the CSS file size to its minimum. [CSSNano](https://cssnano.co/) is used here with a condition that when an environment variable `NODE_ENV` is found with value of "production".

### Copy HTML Files

The following Gulp task definition picks all the HTML files from the `src` folder and copy them to the desitation folder (i.e. `dist`).

```javascript
function copyHtmlTask(cb) {
    return src("./src/**/*.html")
           .pipe(dest("./dist"));
    cb();
}
```

### Watching Changes

Everytime when a change is saved we would like the automation tool to do some relevant processing. If it's an HTML file just copy the latest version to the destination. If it's a CSS file then use the Pre and Post Processor to generate the final outcome and save it into the destination. If it's an image file then use the resize tool and save the outcome to the destination.

```javascript
function watchTask() {
    watch(["./assets/images/**/*.{jpg,png,jpeg}"], series(imagesTask, browsersyncReloadTask));
    watch(["./src/**/*.html"], series(cssTask, copyHtmlTask, browsersyncReloadTask));
    // Tailwind CSS looks into HTML and dynamic include CSS classes that are used to the main.css
    watch(["./assets/styles/**/*.css"], series(cssTask, browsersyncReloadTask));
}
```

The above Gulp task definition tells Gulp to monitor three type of resources: images, HTML files, and CSS files. Each monitor then triggers a serial of tasks. The last task is the Browser-Sync reload.

### NPM Scripts

Finally we export two settings from Gulp for the NPM scripts to reference.

```javascript
exports.default = series(cleanDistTask, copyHtmlTask, cssTask, imagesTask, browsersyncServeInitTask, watchTask);
exports.build = series(cleanDistTask, copyHtmlTask, cssTask, imagesTask);
```

#### Default

```javascript
exports.default = ...
```

This exports the default setting. This is used when `gulp` is executed from the command line (i.e. terminal). The definition is a serial of tasks. It begins with clean the destination folder. Then 

#### Production Build

```javascript
exports.build = ...
```

This export the production build setting. This setting is very much the same as the default setting except the Browser-Sync initiation and watch task are removed.

