import { AuthRepository } from "@/repository/auth.repository";
import { EventRepository } from "@/repository/event.repository";
import { ExhibitorBoothRepository } from "@/repository/exhibitorBooth.repository";
import { ExhibitorDocumentRepository } from "@/repository/exhibitorDocument.repository";
import { VisitorCheckInRepository } from "@/repository/visitorCheckIn.repository";
import { VisitorScannedBoothRepository } from "@/repository/visitorScannedBooth.repository";
import { AuthService } from "@/service/auth.service";
import { EventService } from "@/service/event.service";
import { ExhibitorBoothService } from "@/service/exhibitorBooth.service";
import { VisitorService } from "@/service/visitor.service";

const _authRepository =  new AuthRepository()
export const authService  = new AuthService(_authRepository)

const _eventRepository =  new EventRepository()
export const eventService = new EventService(_eventRepository)



const _exhibitorDocumentRepository = new ExhibitorDocumentRepository()
const _exhibitorBoothRepository= new ExhibitorBoothRepository()
export const exhibitorBoothService = new ExhibitorBoothService(_exhibitorBoothRepository,_eventRepository,_exhibitorDocumentRepository, eventService)

const _visitorCheckInRepository = new VisitorCheckInRepository()
const _visitorScannedBoothRepository = new VisitorScannedBoothRepository()
export const visitorService = new VisitorService(
  _visitorScannedBoothRepository,
  _exhibitorDocumentRepository,
  _exhibitorBoothRepository,
  _eventRepository,
  _authRepository,
  _visitorCheckInRepository
)