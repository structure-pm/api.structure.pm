USE structu_assets;

CREATE TABLE IF NOT EXISTS mandatory_insurance_program (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  ownerID VARCHAR(255) NOT NULL,
  startDate DATE NOT NULL,
  endDate DATE,
  provider VARCHAR(255) NOT NULL,
  policyNumber VARCHAR(255) NOT NULL,
  defaultTermType VARCHAR(50),
  defaultTransactionCode VARCHAR(50),
  defaultPersonalProperty VARCHAR(50),
  defaultPremium DECIMAL(10,2),
  defaultCollateralCode VARCHAR(50),
  defaultTypeCode VARCHAR(50),
  defaultCoverageAmount DECIMAL(12,2),
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mandatory_insurance_enrollment (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  programId INT NOT NULL,
  leaseID INT NOT NULL,
  enrollmentNumber VARCHAR(50) NOT NULL,
  effectiveDate DATE NOT NULL,
  expireDate DATE NOT NULL,
  cancelDate DATE,
  termType VARCHAR(50),
  transactionCode VARCHAR(50),
  personalProperty VARCHAR(50),
  premium DECIMAL(10,2),
  collateralCode VARCHAR(50),
  typeCode VARCHAR(50),
  coverageAmount DECIMAL(12,2),
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TRIGGER before_insert_mandatory_insurance_enrollment
BEFORE INSERT ON mandatory_insurance_enrollment
FOR EACH ROW
  IF new.enrollmentNumber IS NULL
  THEN
    SET new.enrollmentNumber = UUID();
  END IF;
