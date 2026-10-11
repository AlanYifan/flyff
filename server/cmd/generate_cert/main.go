/**
 * @file generate_cert_go.go
 * @description 自签名TLS证书生成工具
 * @description 生成适用于localhost的RSA 2048位自签名证书，有效期10年
 * @description 仅用于开发环境，生产环境请使用正式CA签发的证书
 * @run go run generate_cert_go.go
 */
package main

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"fmt"
	"log"
	"math/big"
	"net"
	"os"
	"time"
)

func main() {
	// 生成ECDSA私钥（P-256曲线，性能优于RSA，HTTP/2推荐）
	privateKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		log.Fatalf("❌ 生成私钥失败: %v", err)
	}

	// 证书序列号
	serialNumber, err := rand.Int(rand.Reader, new(big.Int).Lsh(big.NewInt(1), 128))
	if err != nil {
		log.Fatalf("❌ 生成序列号失败: %v", err)
	}

	// 证书模板
	template := x509.Certificate{
		SerialNumber: serialNumber,
		Subject: pkix.Name{
			Organization: []string{"FlyFF Dev"},
			CommonName:   "localhost",
		},
		NotBefore: time.Now(),
		NotAfter:  time.Now().Add(3650 * 24 * time.Hour), // 10年有效期

		KeyUsage:              x509.KeyUsageDigitalSignature | x509.KeyUsageKeyEncipherment,
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
		BasicConstraintsValid: true,

		// 支持localhost和127.0.0.1
		DNSNames:    []string{"localhost"},
		IPAddresses: []net.IP{net.ParseIP("127.0.0.1"), net.ParseIP("::1")},
	}

	// 自签名：使用自己的私钥签名
	derBytes, err := x509.CreateCertificate(rand.Reader, &template, &template, &privateKey.PublicKey, privateKey)
	if err != nil {
		log.Fatalf("❌ 创建证书失败: %v", err)
	}

	// 写入证书文件
	certFile, err := os.Create("cert.pem")
	if err != nil {
		log.Fatalf("❌ 创建证书文件失败: %v", err)
	}
	defer certFile.Close()

	if err := pem.Encode(certFile, &pem.Block{
		Type:  "CERTIFICATE",
		Bytes: derBytes,
	}); err != nil {
		log.Fatalf("❌ 写入证书失败: %v", err)
	}
	fmt.Println("✅ cert.pem 已生成")

	// 写入私钥文件
	keyFile, err := os.Create("key.pem")
	if err != nil {
		log.Fatalf("❌ 创建密钥文件失败: %v", err)
	}
	defer keyFile.Close()

	privBytes, err := x509.MarshalECPrivateKey(privateKey)
	if err != nil {
		log.Fatalf("❌ 序列化私钥失败: %v", err)
	}

	if err := pem.Encode(keyFile, &pem.Block{
		Type:  "EC PRIVATE KEY",
		Bytes: privBytes,
	}); err != nil {
		log.Fatalf("❌ 写入密钥失败: %v", err)
	}
	fmt.Println("✅ key.pem 已生成")

	fmt.Println()
	fmt.Println("🎉 自签名TLS证书生成完成！")
	fmt.Println("   有效期：10年")
	fmt.Println("   适用域名：localhost")
	fmt.Println("   适用IP：127.0.0.1, ::1")
	fmt.Println()
	fmt.Println("   启动服务端时设置 FLYFF_TLS=true 即可启用HTTP/2")
}
