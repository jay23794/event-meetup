import { AuthRepository } from "@/repository/auth.repository";
import { EventRepository } from "@/repository/event.repository";
import { ExhibitorBoothRepository } from "@/repository/exhibitorBooth.repository";
import { ExhibitorDocumentRepository } from "@/repository/exhibitorDocument.repository";
import { VisitorCheckInRepository } from "@/repository/visitorCheckIn.repository";
import { VisitorScannedBoothRepository } from "@/repository/visitorScannedBooth.repository";
import { AuthService } from "@/service/auth.service";

const _authRepository =  new AuthRepository()
export const authService  = new AuthService(_authRepository)

const _eventRepository =  new EventRepository()
const _exhibitorBoothRepository= new ExhibitorBoothRepository()
const _exhibitorDocumentRepository = new ExhibitorDocumentRepository()
const  _visitorCheckInRepository = new VisitorCheckInRepository()
const _visitorScannedBoothRepository = new VisitorScannedBoothRepository()