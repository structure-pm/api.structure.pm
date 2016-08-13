CREATE DATABASE structu_imports COLLATE utf8_unicode_ci;

CREATE TABLE IF NOT EXISTS structu_imports.imported_account_asset (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  accountNumber VARCHAR(255) NOT NULL,
  vendorID INT NOT NULL,
  expenseID INT NOT NULL,
  assetType ENUM('manager', 'owner', 'location', 'unit'),
  assetID VARCHAR(255),
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modifiedAt TIMESTAMP NOT NULL
);


ALTER TABLE structu_imports.imported_account_asset
ADD UNIQUE `idx_accountasset_accountNumber`(`vendorID`, `accountNumber`);


CREATE TABLE IF NOT EXISTS structu_imports.imported_unknown_account (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  accountNumber VARCHAR(255) NOT NULL,
  vendorID INT NOT NULL,
  scanData TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modifiedAt TIMESTAMP NOT NULL
);


ALTER TABLE structu_imports.imported_unknown_account
ADD UNIQUE `idx_unknownaccount_accountNumber`(`vendorID`, `accountNumber`);
