# Ajnabee - Anonymous Peer-to-Peer Video Chat

Ajnabee is an Omegle-inspired web application that enables users to engage in anonymous video chats with random peers.

## Setup and Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/AkashKarnatak/Ajnabee.git
   ```

2. Navigate to the project directory:

   ```bash
   cd Ajnabee
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Set environment variables:

   ```bash
   echo 'export const WEBSOCKET_URL = "ws://localhost:8080"' >> public/js/env.js
   export SERVER_PORT=8080
   ```
   Make sure the above ports match.

5. Start the server:

   ```bash
   npm run dev
   ```

6. Open a web browser and go to `http://localhost:8080`.

## Contributing

Contributions are welcome! If you find a bug, have an idea for an enhancement, or want to contribute in any way, feel free to open an issue or submit a pull request.

## License

This project is licensed under the AGPL3 License. For details, see the [LICENSE](LICENSE) file.
