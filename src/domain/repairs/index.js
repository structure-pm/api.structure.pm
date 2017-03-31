import * as RepairDb from './repairDb.service';
import {ReadRepair} from './readRepair.service';


ReadRepair.useDb(RepairDb);

export {ReadRepair};
