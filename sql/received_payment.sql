
USE structudev_income;

CREATE TABLE IF NOT EXISTS receivedPayment (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  paymentDate DATE NOT NULL,
  leaseID INT,
  tenantID INT,
  accountID VARCHAR(35),
  locationID VARCHAR(35),
  invoiceID INT,
  amount DECIMAL(10,2),
  items INT,
  comment VARCHAR(500),
  depID INT,
  depDate DATE,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modifiedAt TIMESTAMP NOT NULL
);

ALTER TABLE iLedger
ADD COLUMN receivedPaymentId INT,
ADD INDEX (receivedPaymentId);

USE structudev_income;

ALTER TABLE income ADD COLUMN isFee BOOL;
ALTER TABLE income ADD COLUMN isCredit BOOL;


-- Application Fee, Management Fee
UPDATE income SET isFee=1 WHERE incomeID in (2,48);
INSERT INTO income (type, mapID, isFee) VALUES ('Redecorating Fees', 66, 1);
INSERT INTO income (type, mapID, isFee) VALUES ('Late Fees', 75, 1);
INSERT INTO income (type, mapID, isFee) VALUES ('NSF Fees', 68, 1);
INSERT INTO income (type, mapID, isFee) VALUES ('Pet Rent/Nonrefundable Fees', 69, 1);
INSERT INTO income (type, mapID, isFee) VALUES ('Damage/Cleaning Fees', 71, 1);
INSERT INTO income (type, mapID, isFee) VALUES ('Month to Month Fees', 72, 1);
INSERT INTO income (type, mapID, isFee) VALUES ('Lease Termination Fee', 73, 1);
INSERT INTO income (type, mapID, isFee) VALUES ('Credit Card Processing Fees', 133, 1);
INSERT INTO income (type, mapID, isFee) VALUES ('Bank Fees', 127, 1);
INSERT INTO income (type, mapID, isFee) VALUES ('Court Fees', 215, 1);
