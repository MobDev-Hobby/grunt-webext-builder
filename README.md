# grunt-webext-builder

> Grunt plugin for build chrome, firefox, opera and safari extensions

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-webext-builder --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-webext-builder');
```

## The "webext_builder" task

### Overview
In your project's Gruntfile, add a section named `webext_builder` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  webext_builder: {
    <your_target_name>: {
      // List extension types you want to build
      targets: ["chrome-crx"],
      // Path to chrome extension private key (will be in ./.private.pem if not defined)
      privateKey: "/path/to/private/2049/RSA/key"
      // Mozilla Addons API credentials, go to https://addons.mozilla.org/en-US/developers/addon/api/key/ to receive it
      // It's better to store it in environment, not in this file
      "jwtIssuer": process.env.jwtIssuer,
      "jwtSecret": process.env.jwtSecret,
      files: {
        "extension/dest/dir": ["extension/source/dir"]
      }
    },
  },
});
```

### Options

#### targets
Type: `Array<String>`
Default value: `[]`
Required: `YES`

An array contrains extension targets.
Now only these values are supported:
 - `chrome-crx` - Chrome CRX extension signed with private.pem file
 - `firefox-xpi` - Mozilla Firefox XPI extension signed online with AMO

#### privateKey
Type: `String`
Default value: `'./.private.pem'`
Required: `for chrome-crx only`

Private RSA 2048 key, used for extension sign process

#### jwtIssuer
Type: `String`
Default value: `process.env.jwtIssuer`
Required: `for firefox-xpi only`

https://addons.mozilla.org API Issuer - keep it in safe place! Not on this file directly,
go to https://addons.mozilla.org/en-US/developers/addon/api/key/ to receive or renew it

#### jwtSecret
Type: `String`
Default value: `process.env.jwtSecret`
Required: `for firefox-xpi only`

https://addons.mozilla.org API Secret - keep it in safe place! Not on this file directly,
go to https://addons.mozilla.org/en-US/developers/addon/api/key/ to receive or renew it

#### files
Type: `Object`
Default value: ``
Required: `YES`

Grunt file list, recommended format is:
`"destansion/dir":["source/dir/where/manifest.json/located"]`

### Usage Examples

#### Default Options
In this example, the default options are used to do something with whatever. So if the `testing` file has the content `Testing` and the `123` file had the content `1 2 3`, the generated result would be `Testing, 1 2 3.`

```js
grunt.initConfig({
  webext_builder: {
    options: {},
    files: {
      'dest/default_options': ['src/testing', 'src/123'],
    },
  },
});
```

#### Custom Options
In this example, custom options are used to do something else with whatever else. So if the `testing` file has the content `Testing` and the `123` file had the content `1 2 3`, the generated result in this case would be `Testing: 1 2 3 !!!`

```js
	grunt.loadNpmTasks('grunt-webext-builder');

	grunt.initConfig({
		"webext_builder":{
			"chrome": {
				"privateKey": ".private.pem",
				"targets": [
					"chrome-crx"
				],
				"files": {
					"dest":["build"]
				}
			},
			"firefox": {
				"jwtIssuer": process.env.jwtIssuer,
				"jwtSecret": process.env.jwtSecret,
				"targets": [
					"firefox-xpi"
				],
				"files": {
					"dest":["build"]
				}
			}
		},
```

Run:

!WARNING! when you fuild firefox extension, it's sources will be downloaded to addons.mozilla.com,
but will not be acceccible for public by default. If no extension id defined in manifest.json,
new extension id will be created for any sign. If extension ID defined, you couldn't sign one
 version more than one time.

`jwtIssuer=user:jwtIssuer123 jwtSecret=12345 grunt webext_builder` - build chrome and firefox extensions from some sources
Few files will be produced:
`<dest>/your_extension_name_from_manifest-version-raw.xpi` - unsigned FF extension
`<dest>/your_extension_name_from_manifest-version-an+fx.xpi` - signed FF extension
`<dest>/your_extension_name_from_manifest-version-signed.crx` - signed Chrome extension
`./.private.pem` or `<privateKey>` - extension private key, if not exists yet !keep it in safe place!

`jwtIssuer=user:jwtIssuer123 jwtSecret=12345 grunt webext_builder:firefox` - build firefox extensions
Few files will be produced:
`<dest>/your_extension_name_from_manifest-version-raw.xpi` - unsigned FF extension
`<dest>/your_extension_name_from_manifest-version-an+fx.xpi` - signed FF extension

`grunt webext_builder:chrome` - build chrome extensions
One file will be produced:
`<dest>/your_extension_name_from_manifest-version-signed.crx` - signed Chrome extension
`./.private.pem` or `<privateKey>` - extension private key, if not exists yet !keep it in safe place!


## Contributing
Feel free to contribute this repo :)
Unit tests, examples, codestyle, anything else - you are wellcome!

## Release History
`0.1.0` - First extension version. No unit tests, bad codestyle, but seems like it works :)
