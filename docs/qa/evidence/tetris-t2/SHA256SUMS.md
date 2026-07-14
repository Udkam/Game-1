# Tetris T2 candidate evidence SHA-256

Source baseline: `0a28a1f4efad72296e46b0a91d859c45cc300edf`.

## Canonical Git blob checksum semantics

Every value below is the SHA-256 of the canonical Git blob bytes stored by the
candidate commit. It is never the working-tree file and never checkout-filtered bytes;
therefore it is identical with `core.autocrlf` set to either `true` or `false`.

To reproduce one entry, stream the exact blob directly from Git (replace
`<candidate>` and `<path>`; do not open the working-tree file):

```text
python -c "import hashlib,subprocess,sys; p=subprocess.Popen(['git','show',f'{sys.argv[1]}:{sys.argv[2]}'],stdout=subprocess.PIPE); h=hashlib.sha256(); [h.update(c) for c in iter(lambda:p.stdout.read(65536),b'')]; p.wait(); print(h.hexdigest()); raise SystemExit(p.returncode)" <candidate> <path>
```

`browser-evidence.json` records `result: "passed"`, 16 captures, zero
console/page errors, and the same canonical-blob SHA-256 values below for every
referenced PNG. `rules-replay.json` is a public-command/replay proof.

```text
bd1bed9445d058143b9aac6c8af5f6eaccf634addb2a5f5eaf1baa1b203b6c10  browser-evidence.json
97fafadc2c29c6161aa56a3ac21e60b2d12545def7ab5f2fec1511b2016c9194  rules-replay.json
72ef48265914bd30f3aab8061bec3f5259074c09c70ef1eb39289a510f841301  desktop-ready.png
4b71d9131cf684ad856b284cb92adef6af4a6054e44f66c83d93d96b63e88c37  desktop-playing.png
e4b968696b90049507de31d9dda8e95e274b9f853f13d39d6706bf92a8f0a3b2  desktop-paused.png
06bc2fc5e27263a4deb35ccf40caf9f5927dfa965bf3c10e224b63d3f22e124d  desktop-mode-switch.png
cbb5ffc6fd1ff618a8833965cf408e5f4a2b13864311f537605ad6c3c90be30a  portrait-ready.png
7d78443cb29697433cbe4b02474620ce03e3bcfd3edeb1da2c0414cfc99a7312  portrait-playing.png
eac99eff5575405fb2a53b40a35fd41f273a4ce13176468ef22838f50283f63d  portrait-paused.png
e865bc2713b0a096097a39c670d5686c98fd72ba57affe0d34046f93319f136b  portrait-mode-switch.png
749faf811f085d7f03fa17dfed4278f96021d4d28f462d93c8694ed8191a4b89  landscape-ready.png
fd0db1b546268d8b7ad55d6556b6ec5426cef2ac6f1c7126ef6b347e03b80e4e  landscape-playing.png
a50d3c127486c683948c1096a25e2f33c8af43644d0ef209fbf076b47767dbd1  landscape-paused.png
cd4001bc267c08928c70706e9381ef49a8f33ca194cf5fdf46306cb8d680bb39  landscape-mode-switch.png
9a59ed06bbc19698a1e301cef438e33e3bcfbc5b1b9a2ab5974c9d4deb2f11c5  desktop-race-first-lock.png
70a929489c4b654ba16373ba7173ea3c69c04e12994aead579690bdc7ea8c28a  desktop-race-finished.png
3367318af013d01e6e5228d4b61761e612b81c36863b591b42896dc177f0a75e  desktop-marathon-top-out.png
837222cf3eed422d934b55c6f9a60b32ef323914ade0ca4c923b498fa6020e45  desktop-puzzle-rotation-finished.png
```
