# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Fixed
- README.md: Fixed typo. Add Table of Contents and Changelog section.
- README.md.: Added create-react-app and JSFiddle examples.
- Makefile: Fixed `emcc` version checking not working correctly with shell in older standard [#20]. Thanks [@rowntreerob]!

[@rowntreerob]: https://github.com/rowntreerob
[#20]: https://github.com/kbumsik/opus-media-recorder/issues/20

## [0.7.19]
### Fixed
- Makefile: Updated for emscripten 1.38.34. Fix minor bugs
- Fixed umd encoder worker didn't correctly initiate. [#19]
- README.md: Use yarn instead of npm. Use UMD module in example, in response to [#19].

### Added
- Add `example/create-react-app`.

[#19]: https://github.com/kbumsik/opus-media-recorder/issues/19

## [0.7.18]
### Fixed
- Addressed an issue that AudioContext objects never closed [#18].
- Fixed typos in README.md [#16].

[#18]: https://github.com/kbumsik/opus-media-recorder/issues/18
[#16]: https://github.com/kbumsik/opus-media-recorder/issues/16

[Unreleased]: https://github.com/kbumsik/opus-media-recorder/compare/0.7.19...HEAD
[0.7.19]: https://github.com/kbumsik/opus-media-recorder/compare/0.7.18...0.7.19
[0.7.18]: https://github.com/kbumsik/opus-media-recorder/compare/0.7.17...0.7.18
[0.7.17]: https://github.com/kbumsik/opus-media-recorder/releases/tag/0.7.17
