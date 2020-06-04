# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.7.19]
### Fixed
- Makefile: Updated for emscripten 1.38.34. Fix minor bugs
- Fix that the umd encoder worker didn't correctly initiate. [#19]

### Added
- Add `example/create-react-app`.

[#19]: https://github.com/kbumsik/opus-media-recorder/issues/19

## [0.7.18]
### Fixed
- Address issue that AudioContext objects never closed [#18].
- Fix typos in README.md [#16].

[#18]: https://github.com/kbumsik/opus-media-recorder/issues/18
[#16]: https://github.com/kbumsik/opus-media-recorder/issues/16

[Unreleased]: https://github.com/kbumsik/opus-media-recorder/compare/0.7.19...HEAD
[0.7.19]: https://github.com/kbumsik/opus-media-recorder/compare/0.7.18...0.7.19
[0.7.18]: https://github.com/kbumsik/opus-media-recorder/compare/0.7.17...0.7.18
[0.7.17]: https://github.com/kbumsik/opus-media-recorder/releases/tag/0.7.17
