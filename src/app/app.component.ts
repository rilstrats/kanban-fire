import { CdkDragDrop, transferArrayItem } from '@angular/cdk/drag-drop';
import { Component, inject } from '@angular/core';
import { Task } from './task/task';
import { MatDialog } from '@angular/material/dialog'
import { TaskDialogComponent, TaskDialogResult } from './task-dialog/task-dialog.component';
import { Observable, BehaviorSubject } from 'rxjs';
// import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { Firestore, collection, collectionData, addDoc, deleteDoc, setDoc, CollectionReference, runTransaction, doc } from '@angular/fire/firestore'

// const getObservable = (collection: AngularFirestoreCollection<Task>) => {
//   const subject = new BehaviorSubject<Task[]>([]);
//   collection.valueChanges({ idField: 'id' }).subscribe((val: Task[]) => {
//     subject.next(val);
//   });
//   return subject;
// };

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  private firestore: Firestore = inject(Firestore)
  todo$: Observable<Task[]>;
  inProgress$: Observable<Task[]>;
  done$: Observable<Task[]>;

  todoCollection: CollectionReference;
  inProgressCollection: CollectionReference;
  doneCollection: CollectionReference;

  // laneCollections: { [id: string]: CollectionReference };
  // lanes: { [id: string]: Observable<Task[]> };

  title = 'Hello';

  // todo = this.store.collection('todo').valueChanges({ idField: 'id' }) as Observable<Task[]>;
  // inProgress = this.store.collection('inProgress').valueChanges({ idField: 'id' }) as Observable<Task[]>;
  // done = this.store.collection('done').valueChanges({ idField: 'id' }) as Observable<Task[]>;

  // todoCollection: AngularFirestoreCollection<Task>;
  // todo2: Observable<Task[]>
  constructor(
    private dialog: MatDialog,
    // private store: AngularFirestore
  ) {
    const todoCollection = collection(this.firestore, 'todo');
    this.todo$ = collectionData(todoCollection, { idField: 'id' }) as Observable<Task[]>;

    const inProgressCollection = collection(this.firestore, 'inProgress');
    this.inProgress$ = collectionData(inProgressCollection, { idField: 'id' }) as Observable<Task[]>;

    const doneCollection = collection(this.firestore, 'done');
    this.done$ = collectionData(doneCollection, { idField: 'id' }) as Observable<Task[]>;

    // this.laneCollections = {
    //   "todo": todoCollection,
    //   "inProgress": inProgressCollection,
    //   "done": doneCollection
    // };
    // this.lanes = {
    //   "todo": this.todo$,
    //   "inProgress": this.inProgress$,
    //   "done": this.done$
    // };
  }

  editTask(list: 'done' | 'todo' | 'inProgress', task: Task): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '270px',
      data: {
        task,
        enableDelete: true,
      },
    });
    dialogRef.afterClosed().subscribe((result: TaskDialogResult | undefined) => {
      if (!result) {
        return;
      }
      if (result.delete) {
        // this.store.collection(list).doc(task.id).delete();
        deleteDoc(doc(collection(this.firestore, list), task.id))
      } else {
        // this.store.collection(list).doc(task.id).update(task);
        setDoc(doc(collection(this.firestore, list), task.id), task)
      }
    });
  }

  drop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      return;
    }
    const item = event.previousContainer.data[event.previousIndex];
    // this.store.firestore.runTransaction(() => {
    //   const promise = Promise.all([
    //     this.store.collection(event.previousContainer.id).doc(item.id).delete(),
    //     this.store.collection(event.container.id).add(item),
    //   ]);
    //   return promise;
    // });
    runTransaction(
      this.firestore,
      () => {
        const promise = Promise.all([
          // this.store.collection(event.previousContainer.id).doc(item.id).delete(),
          deleteDoc(doc(collection(this.firestore, event.previousContainer.id), item.id)),
          // this.store.collection(event.container.id).add(item),
          addDoc(collection(this.firestore, event.container.id), item)
        ]);
        return promise;
      }
    )
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );
  }

  newTask(): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '270px',
      data: {
        task: {},
      },
    });
    dialogRef
      .afterClosed()
      .subscribe((result: TaskDialogResult | undefined) => {
        if (!result) {
          return;
        }
        addDoc(collection(this.firestore, 'todo'), result.task)
        // this.store.collection('todo').add(result.task);
      });
  }
}
