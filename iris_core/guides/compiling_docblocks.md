# Compiling JSDoc blocks

1. Install the `jsdoc` module globally using npm:
```
$ sudo npm install -g jsdoc
```
2. Compile the docs with JSDoc using this command:
```
$ jsdoc -c jsdoc_conf.json -r -d docs
```
 - The -c parameter specifies that the configuration file `jsdoc_conf.json` should be used.
 - The -r parameter specifies that the blocks should be searched for recursively.
 - The -d parameter specifies the output directory.

3. Open `docs/index.html` locally in your browser.
