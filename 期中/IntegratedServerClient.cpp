
#include <iostream>
#include <string>
#include <map>
#include <winsock2.h>
#include <thread>

#pragma comment(lib, "ws2_32.lib")

std::map<std::string, std::string> user_database; // 模擬用戶數據庫

void handle_client(SOCKET client_socket) {
    char buffer[1024];
    int bytes_received = recv(client_socket, buffer, sizeof(buffer) - 1, 0);
    if (bytes_received > 0) {
        buffer[bytes_received] = '\0';
        std::string request(buffer);
        std::string response;

        if (request.find("REGISTER") == 0) {
            std::string username = request.substr(9, request.find(' ', 9) - 9);
            std::string password = request.substr(request.find(' ', 9) + 1);
            if (user_database.find(username) != user_database.end()) {
                response = "ERROR: User already exists.";
            } else {
                user_database[username] = password;
                response = "SUCCESS: User registered.";
            }
        } else if (request.find("LOGIN") == 0) {
            std::string username = request.substr(6, request.find(' ', 6) - 6);
            std::string password = request.substr(request.find(' ', 6) + 1);
            if (user_database.find(username) != user_database.end() && user_database[username] == password) {
                response = "SUCCESS: Login successful.";
            } else {
                response = "ERROR: Invalid username or password.";
            }
        } else {
            response = "ERROR: Invalid command.";
        }

        send(client_socket, response.c_str(), response.size(), 0);
    }
    closesocket(client_socket);
}

void run_server() {
    WSADATA wsa_data;
    if (WSAStartup(MAKEWORD(2, 2), &wsa_data) != 0) {
        std::cerr << "WSAStartup failed.\n";
        return;
    }

    SOCKET server_socket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (server_socket == INVALID_SOCKET) {
        std::cerr << "Socket creation failed.\n";
        WSACleanup();
        return;
    }

    sockaddr_in server_address = {};
    server_address.sin_family = AF_INET;
    server_address.sin_addr.s_addr = INADDR_ANY;
    server_address.sin_port = htons(12345);

    if (bind(server_socket, (sockaddr*)&server_address, sizeof(server_address)) == SOCKET_ERROR) {
        std::cerr << "Bind failed.\n";
        closesocket(server_socket);
        WSACleanup();
        return;
    }

    if (listen(server_socket, 5) == SOCKET_ERROR) {
        std::cerr << "Listen failed.\n";
        closesocket(server_socket);
        WSACleanup();
        return;
    }

    std::cout << "Server running on port 12345...\n";

    while (true) {
        SOCKET client_socket = accept(server_socket, nullptr, nullptr);
        if (client_socket != INVALID_SOCKET) {
            std::thread(handle_client, client_socket).detach();
        }
    }

    closesocket(server_socket);
    WSACleanup();
}

void run_client() {
    while (true) {
        WSADATA wsa_data;
        if (WSAStartup(MAKEWORD(2, 2), &wsa_data) != 0) {
            std::cerr << "WSAStartup failed.\n";
            return;
        }

        SOCKET client_socket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
        if (client_socket == INVALID_SOCKET) {
            std::cerr << "Socket creation failed.\n";
            WSACleanup();
            return;
        }

        sockaddr_in server_address = {};
        server_address.sin_family = AF_INET;
        server_address.sin_addr.s_addr = inet_addr("127.0.0.1"); // 本地伺服器
        server_address.sin_port = htons(12345);

        if (connect(client_socket, (sockaddr*)&server_address, sizeof(server_address)) == SOCKET_ERROR) {
            std::cerr << "Connection failed.\n";
            closesocket(client_socket);
            WSACleanup();
            return;
        }

        std::cout << "Enter command (REGISTER/LOGIN): ";
        std::string command;
        std::getline(std::cin, command);

        send(client_socket, command.c_str(), command.size(), 0);

        char buffer[1024];
        int bytes_received = recv(client_socket, buffer, sizeof(buffer) - 1, 0);
        if (bytes_received > 0) {
            buffer[bytes_received] = '\0';
            std::cout << "Server response: " << buffer << std::endl;
        }

        closesocket(client_socket);
        WSACleanup();
    }
}

int main() {
    std::cout << "Select mode (1: Server, 2: Client): ";
    int mode;
    std::cin >> mode;
    std::cin.ignore(); // 清除緩衝區中的換行符

    if (mode == 1) {
        run_server();
    } else if (mode == 2) {
        run_client();
    } else {
        std::cerr << "Invalid mode.\n";
    }

    return 0;
}
