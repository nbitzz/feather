# Project structure

- `background/` contains all code which runs in the background.
- `rpc/` contains all code for handling communications to the Discord RPC server.
    - `rpc/mother` contains the code which allows the background script to talk with its child.
    - `rpc/bridge` contains the code which allows `rpc/child` to run in a Discord iframe on Chrome.
    - `rpc/child` contains the code which communicates with the RPC server.
- `ui/` contains all code for Feather's user interface.
- `runner/` contains all code for the presence runner.
    - `runner/runtime` contains the code used to run a presence.
        - `runner/runtime/api` includes the PreMiD API reimplementation.
    - `runner/interface` contains the code used to open and manage connections between the runtime and background script.
- `util/` contains various utilities used throughout the Feather codebase.
- `i18n/` contains strings used throughout Feather.