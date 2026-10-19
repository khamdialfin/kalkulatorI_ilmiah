// Kalkulator Ilmiah Konsol - C++17
// Kompilasi: g++ -std=c++17 -Wall -o kalkulator kalkulator_ilmiah.cpp

#include <cctype>
#include <cmath>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>

using namespace std;

const double PI = acos(-1.0);

class Parser {
public:
    Parser(const string& text, bool degreeMode, double ans)
        : s(text), pos(0), deg(degreeMode), lastAns(ans) {}

    double parse() {
        double v = expr();
        skipSpace();
        if (pos != s.size())
            throw runtime_error(string("Karakter tidak dikenal: '") + s[pos] + "'");
        return v;
    }

private:
    string s;
    size_t pos;
    bool deg;
    double lastAns;

    void skipSpace() {
        while (pos < s.size() && isspace(static_cast<unsigned char>(s[pos]))) pos++;
    }

    bool match(char c) {
        skipSpace();
        if (pos < s.size() && s[pos] == c) { pos++; return true; }
        return false;
    }

    // expr -> term (('+' | '-') term)*
    double expr() {
        double v = term();
        while (true) {
            if (match('+')) v += term();
            else if (match('-')) v -= term();
            else return v;
        }
    }

    // term -> unary (('*' | '/' | '%') unary)*
    double term() {
        double v = unary();
        while (true) {
            if (match('*')) v *= unary();
            else if (match('/')) {
                double d = unary();
                if (d == 0) throw runtime_error("Pembagian dengan nol");
                v /= d;
            } else if (match('%')) {
                double d = unary();
                if (d == 0) throw runtime_error("Modulo dengan nol");
                v = fmod(v, d);
            } else return v;
        }
    }

    // unary -> '-' unary | '+' unary | power
    double unary() {
        if (match('-')) return -unary();
        if (match('+')) return unary();
        return power();
    }

    // power -> primary ('^' unary)?   (asosiatif kanan)
    double power() {
        double base = primary();
        if (match('^')) return pow(base, unary());
        return base;
    }

    double primary() {
        skipSpace();
        if (pos >= s.size()) throw runtime_error("Ekspresi tidak lengkap");

        if (match('(')) {
            double v = expr();
            if (!match(')')) throw runtime_error("Kurung tutup ')' hilang");
            return v;
        }
        if (isdigit(static_cast<unsigned char>(s[pos])) || s[pos] == '.') return number();
        if (isalpha(static_cast<unsigned char>(s[pos]))) return identifier();
        throw runtime_error(string("Karakter tidak dikenal: '") + s[pos] + "'");
    }

    double number() {
        size_t start = pos;
        while (pos < s.size() && (isdigit(static_cast<unsigned char>(s[pos])) || s[pos] == '.')) pos++;
        return stod(s.substr(start, pos - start));
    }

    double identifier() {
        size_t start = pos;
        while (pos < s.size() && isalnum(static_cast<unsigned char>(s[pos]))) pos++;
        string name = s.substr(start, pos - start);

        // Konstanta
        if (name == "pi") return PI;
        if (name == "e") return exp(1.0);
        if (name == "ans") return lastAns;

        // Fungsi: nama(ekspresi)
        if (!match('(')) throw runtime_error("Fungsi '" + name + "' butuh tanda kurung");
        double x = expr();
        if (!match(')')) throw runtime_error("Kurung tutup ')' hilang");
        return applyFunction(name, x);
    }

    double toRad(double x) const { return deg ? x * PI / 180.0 : x; }
    double fromRad(double x) const { return deg ? x * 180.0 / PI : x; }

    double applyFunction(const string& f, double x) {
        if (f == "sin") return sin(toRad(x));
        if (f == "cos") return cos(toRad(x));
        if (f == "tan") return tan(toRad(x));
        if (f == "asin" || f == "acos") {
            if (x < -1 || x > 1) throw runtime_error("Input " + f + " harus di antara -1 dan 1");
            return fromRad(f == "asin" ? asin(x) : acos(x));
        }
        if (f == "atan") return fromRad(atan(x));
        if (f == "sqrt") {
            if (x < 0) throw runtime_error("Akar bilangan negatif");
            return sqrt(x);
        }
        if (f == "ln") {
            if (x <= 0) throw runtime_error("ln hanya untuk x > 0");
            return log(x);
        }
        if (f == "log") {
            if (x <= 0) throw runtime_error("log hanya untuk x > 0");
            return log10(x);
        }
        if (f == "exp") return exp(x);
        if (f == "abs") return fabs(x);
        if (f == "fact") {
            if (x < 0 || x != floor(x) || x > 170) throw runtime_error("fact butuh bilangan bulat 0..170");
            double r = 1;
            for (int i = 2; i <= static_cast<int>(x); i++) r *= i;
            return r;
        }
        throw runtime_error("Fungsi tidak dikenal: " + f);
    }
};

void printHelp() {
    cout << "\n=== KALKULATOR ILMIAH ===\n"
         << "Operator : + - * / % ^ ( )\n"
         << "Fungsi   : sin cos tan asin acos atan sqrt ln log exp abs fact\n"
         << "Konstanta: pi e ans (hasil terakhir)\n"
         << "Perintah : mode deg | mode rad | history | help | exit\n"
         << "Contoh   : 2*(3+4)^2 , sin(30) , sqrt(16)+ans , fact(5)\n\n";
}

int main() {
    bool degreeMode = true;
    double ans = 0;
    vector<string> history;
    string line;

    printHelp();
    cout << setprecision(10);

    while (true) {
        cout << (degreeMode ? "[DEG] " : "[RAD] ") << "> ";
        if (!getline(cin, line)) break;
        if (line.find_first_not_of(" \t") == string::npos) continue;

        if (line == "exit" || line == "quit") break;
        if (line == "help") { printHelp(); continue; }
        if (line == "mode deg") { degreeMode = true; cout << "Mode sudut: derajat\n"; continue; }
        if (line == "mode rad") { degreeMode = false; cout << "Mode sudut: radian\n"; continue; }
        if (line == "history") {
            if (history.empty()) cout << "(riwayat kosong)\n";
            for (size_t i = 0; i < history.size(); i++)
                cout << i + 1 << ". " << history[i] << "\n";
            continue;
        }

        try {
            Parser p(line, degreeMode, ans);
            ans = p.parse();
            cout << "= " << ans << "\n";
            ostringstream oss;
            oss << setprecision(10) << line << " = " << ans;
            history.push_back(oss.str());
        } catch (const exception& e) {
            cout << "Error: " << e.what() << "\n";
        }
    }

    cout << "Sampai jumpa!\n";
    return 0;
}