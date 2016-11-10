
USE structutest_income;

CREATE TABLE IF NOT EXISTS receivedPayment (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  leaseID INT,
  tenantID INT,
  amount DECIMAL(10,2),
  items INT,
  comment VARCHAR(500),
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modifiedAt TIMESTAMP NOT NULL
);

ALTER TABLE iLedger
ADD COLUMN receivedPaymentId INT,
ADD INDEX (receivedPaymentId);
